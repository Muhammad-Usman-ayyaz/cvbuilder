"""
Calls Gemini to score a resume against a job description, using structured
JSON output so the response is guaranteed to match AtsAnalysisResult
instead of being free text that has to be parsed out with regex.
"""

import copy
import json
import logging
import os
import time
import uuid

import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from models import (
    AnalyzeRequest,
    AtsAnalysisResult,
    CHANGE_TYPES,
    ExtractedResume,
    ImprovementProposal,
    ImproveRequest,
    ImproveResult,
    ProposedChange,
)

logger = logging.getLogger("ats-service")

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

# Google's flash-tier models frequently go 503 "high demand" independently
# of each other (observed: gemini-3.6-flash and gemini-3.5-flash both down
# for hours while gemini-3.1-flash-lite / gemini-3-flash-preview stayed up).
# Falling back through this list keeps the service up across those blips
# instead of hard-failing every request until someone notices and edits
# .env. GEMINI_MODEL is tried first, then these, skipping duplicates.
FALLBACK_MODELS = [GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-flash-latest"]
FALLBACK_MODELS = list(dict.fromkeys(FALLBACK_MODELS))


def _generate_with_fallback(prompt: str, response_schema):
    """
    Tries each model in FALLBACK_MODELS in order, moving to the next one on
    a 503 (server overloaded), a client-side timeout, or a 429 (that
    specific model's own per-model daily quota is exhausted — Google's free
    tier tracks GenerateRequestsPerDayPerProjectPerModel *per model*, so
    gemini-3.6-flash being out of quota says nothing about whether
    gemini-3.1-flash-lite still has budget left, confirmed directly: the
    429 response body names the exhausted model explicitly) — any other
    error (bad request, auth, a quota error with no clear model-specific
    cause) is real and should surface immediately rather than burning
    through the whole list.
    """
    client = get_client()
    last_error = None
    for model in FALLBACK_MODELS:
        try:
            return client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
        except (errors.ServerError, httpx.HTTPError) as e:
            logger.warning("Gemini model %s unavailable (%s), trying next fallback", model, e)
            last_error = e
            time.sleep(1)
        except errors.ClientError as e:
            # 499/408: a client-side timeout firing mid-request surfaces as
            # a "CANCELLED"-style ClientError (the aborted connection reads
            # as a 4xx from Google's side), not a 503 — still a "this model
            # didn't respond in time" case that should fail over.
            # 429: this model's own per-model quota is exhausted, not a
            # project-wide block — see docstring above.
            if e.code in (499, 408, 429):
                logger.warning("Gemini model %s unavailable (%s), trying next fallback", model, e)
                last_error = e
                time.sleep(1)
            else:
                raise
    raise last_error

_client = None


def get_client() -> genai.Client:
    """
    Lazily builds the Gemini client so a missing API key fails with a clear
    error at request time (with a real error message), not a cryptic one
    at import time before the app has even started logging anything.
    """
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set — add it to ats-service/.env")
        # The SDK's default retry policy re-tries a 503 on the SAME model
        # for ~30s (exponential backoff) before raising — which alone can
        # exceed the Node backend's request timeout. FALLBACK_MODELS below
        # already retries across models, so disable the SDK's own retries
        # (attempts=1) and cap each individual call at 20s so a model that's
        # slow/hanging under load (not even fast-failing with a 503) can't
        # stall the whole fallback chain — let a slow or 503'd model fail
        # over to the next one instead. 20s (not 10s) because /extract's
        # prompt+schema is heavier than /analyze's — a 10s cap was observed
        # cutting off calls that were on track to succeed, surfacing as a
        # Google-side "499 CANCELLED" from the aborted connection.
        _client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(attempts=1),
                timeout=20_000,
            ),
        )
    return _client


def build_prompt(resume_content: dict, job_description: str) -> str:
    return f"""You are a strict ATS (Applicant Tracking System) resume analyzer. Compare the resume against the job description and produce a structured analysis. Be a harsh, literal grader — do not be generous or encouraging. It is better to under-score than to inflate a score.

STEP 0 — VALIDITY CHECK (do this before anything else):
Judge whether the JOB DESCRIPTION text below is an actual, coherent job description — i.e. it describes (even briefly) a role, responsibilities, required skills, or qualifications for a position. It does NOT need to be long or well-formatted, but it must be recognizably about a job.

If it is NOT a real job description — e.g. it's gibberish, random/unrelated text (a recipe, lorem ipsum, a story, keyboard-mashing, an unrelated product description, etc.) — then:
- keywordMatch.score MUST be exactly 0
- keywordMatch.matched MUST be an empty list
- keywordMatch.missing MUST be an empty list (there is nothing valid to extract, so don't invent keywords)
- overallScore MUST be exactly 0, regardless of how good the resume's formatting is
- warnings MUST include a clear statement that the input does not appear to be a valid job description, and that no meaningful comparison could be performed
- Skip keyword extraction and the overall-score formula below entirely — still run the formatting checks (step 2) for informational purposes, but they must not raise overallScore above 0

Only proceed to steps 1-3 if the job description passes this check.

STEP 1 — keywordMatch (strict matching, weighted against keyword stuffing):
Extract the meaningful skills, tools, technologies, and explicit requirements stated in the job description (ignore filler words like "team player" or "fast-paced environment" unless the JD frames them as a hard requirement). For each extracted keyword, decide how strongly it is actually evidenced in the resume, and assign it a credit weight:
   - FULL credit (1.0): the keyword is backed by real context — it appears within (or is a clear, unambiguous equivalent used within, e.g. "JS" ⇄ "JavaScript", "Node" ⇄ "Node.js", "K8s" ⇄ "Kubernetes") an experience bullet, project description, or summary sentence that describes something the candidate actually did with it. This is genuine demonstrated evidence, not just a mention.
   - PARTIAL credit (0.4): the keyword appears ONLY as a bare entry in a skills/tools list (or similarly listed with no elaboration), with zero supporting mention anywhere else in the resume (no experience bullet, no project, no summary sentence backs it up). A skill claimed once with no demonstrated context is weak, unverifiable evidence — this is the "keyword stuffing" case, and it must NOT be treated the same as a keyword the candidate has actually shown they used.
   - NO credit (0): the keyword does not appear anywhere, or only via a vague/unrelated mention. Add it to missing.
   Do NOT give FULL or PARTIAL credit based on: a related-but-different skill, general seniority/experience level, industry proximity, or "the candidate could probably do this." If you are not confident a keyword is genuinely present in some form, treat it as NO credit. Err toward less credit, not more.
   - score: 0-100, computed as (sum of credit weights across all extracted keywords / total extracted keywords) × 100, rounded to the nearest integer. This means a resume that only lists keywords in a skills section with no supporting evidence caps out around 40% keyword match even if every keyword is present.
   - matched: every keyword given FULL or PARTIAL credit (nonzero) — the exact keywords/phrases found
   - missing: every keyword given NO credit — this list must be genuinely absent (or only vaguely/unrelated) from the resume, not borderline cases

STEP 2 — formatting (concrete, consistent pass/fail criteria — apply these definitions exactly, do not substitute your own judgment):
   - "Contact info present": resume has both an email address and a phone number.
   - "Professional summary present": a summary/objective field exists and contains at least one non-trivial sentence (not empty, not a placeholder like "TODO" or "N/A").
   - "Experience section exists": at least one work experience entry is present.
   - "Experience entries have dates": every experience entry has both a start date and an end date (or "Present"/current).
   - "Experience entries have real descriptions": every experience entry has a non-empty description of at least ~10 words describing actual duties or work — not just a job title repeated.
   - "Quantified achievements present": at least one experience entry description contains a measurable result that is a genuine, credible outcome — a number, percentage, dollar amount, count of people/projects, or time saved, that is clearly tied to a specific result (e.g. "increased conversion by 20% over 2 quarters", "led a team of 5 engineers", "cut build time from 12min to 3min"). Do NOT count: dates, phone numbers, job titles with numbers, years of experience, or a bare vague claim with no number ("improved performance", "increased efficiency", "boosted sales") — those are unquantified regardless of confident-sounding language. Fail this check if no description anywhere contains a genuine, specific, credible metric.
   - "Content is specific and outcome-driven, not generic filler": PASS only if the majority of experience bullet points describe a concrete action, tool/technology, and result or scope (what was built/done, with what, and what happened because of it). FAIL if the majority of bullets are generic responsibility statements with no specifics — e.g. "Responsible for X", "Duties included Y", "Worked on Z", "Helped with A" — that could describe almost any employee in that role and give no evidence of actual impact or skill level. This check exists specifically to catch resumes that are technically complete but substantively thin.
   - "Education section exists": at least one education entry is present.
   - "Skills section has real items": a skills section exists and lists at least 3 concrete, specific items (not vague terms like "hard worker").
   - Add further checks only if something concrete and objectively verifiable stands out (e.g. clearly inconsistent date formats, overlapping employment dates that don't make sense). Do not add vague/subjective checks.
For each check, set passed strictly per the definition above, and give a one-sentence factual note (what you actually found, not a suggestion).

STEP 3 — overallScore formula (only when the job description passed the validity check in step 0):
Compute overallScore as: (keywordMatch.score × 0.7) + (formattingScore × 0.3), rounded to the nearest integer, where formattingScore = (count of passed formatting checks / total formatting checks) × 100.
Do not deviate from this formula or adjust the result based on a subjective "feel" for the resume — a resume with 0% keyword match and perfect formatting should score around 30 (0×0.7 + 100×0.3), not higher.
Because keyword-stuffed, unsubstantiated skills now earn only PARTIAL credit in step 1, and thin/generic content now fails two formatting checks in step 2 ("Quantified achievements present" and "Content is specific and outcome-driven"), a resume that lists lots of matching keywords but backs them up with weak, generic, unquantified bullet points should land well below 80 overall — do not round up or compensate for weak content. Conversely, a resume with genuinely strong keyword coverage backed by specific, quantified, outcome-driven content should still score high; this stricter grading is meant to separate real matches from superficial ones, not to suppress every score.

STEP 4 — warnings:
Short, plain-language warnings when appropriate — e.g. if the job description failed the validity check (step 0), if the resume is essentially empty (no real experience/education/skills content), or if the job description is too short/thin to meaningfully extract keywords from even though it is a real JD. Return an empty list only if nothing is concerning.

STEP 5 — scoreBreakdown (skip / return all-zero categories with an explanation noting the invalid JD if step 0 failed):
Produce eight ScoreCategory objects — keywordMatch, skillsAlignment, experienceRelevance, educationAlignment, titleAlignment, formatting, achievements, overallRelevance. For each: a 0-100 score, a short label (e.g. "Strong", "Weak"), a factual explanation grounded in the actual resume/JD text, an evidence list (short quotes/paraphrases of what actually supports the score), a missing list (JD-relevant things this category doesn't find evidence for — phrase every entry as "Not found in the CV" / "Not demonstrated in the CV" / "Could not verify from the submitted resume", NEVER as "you don't have X" or "you lack X" — the CV simply not mentioning something is not proof the candidate lacks it), and a priority (how much fixing this category's gaps would matter for this specific JD). keywordMatch here should be consistent with step 1's score; formatting here should be consistent with step 2's formattingScore.

STEP 6 — requirements:
List the concrete requirements/qualifications actually stated in the job description (degree, years of experience, specific skills, domain experience, tools, certifications, etc.), and classify each as an JD-required (isPreferred=false) or explicitly optional/"nice to have"/"preferred" (isPreferred=true) per the JD's own language. For each requirement, decide based on the resume:
   - matched: clearly and directly supported by resume content — include a short evidence quote/paraphrase.
   - partial: related but incomplete or weak evidence exists (e.g. adjacent technology, shorter duration than asked, listed but not elaborated) — include what evidence does exist and why it's incomplete.
   - missing: not supported by the resume at all — evidence field must use "Not found in the CV" phrasing, never a claim the candidate lacks it.
   Preferred/optional requirements go into whichever matched/partial/missing bucket fits AND are also included in the `preferred` list (do not double-classify mandatory requirements as preferred).

STEP 7 — keywords:
Using the same keywords extracted in step 1, additionally tier them: matched (full+partial credit ones, same as keywordMatch.matched), partial (specifically the PARTIAL-credit-only ones — bare skills-list mentions with no elaboration), missingHighPriority (missing keywords the JD emphasizes heavily — repeated, in the title, or framed as core/required), missingMediumPriority (missing keywords mentioned once or framed as secondary). Do not recommend adding a keyword merely to pad a list — only include genuinely JD-relevant terms.

STEP 8 — contentIssues (evidence-based only — omit entirely, i.e. return an empty list, if the resume's content is genuinely solid):
Identify real, specific content-quality problems: vague statements, weak/passive action verbs, repetitive wording, bullets lacking specificity, missing measurable outcomes, overly long bullets, irrelevant information, a weak/generic professional summary, unclear responsibilities. For each: issue (what's wrong), evidence (the actual text from the resume that has the problem), whyItMatters (why this hurts the candidate's chances for THIS job), suggestion (a concrete direction for improvement that does NOT invent new facts — e.g. "describe the actual process and measurable outcome if the candidate genuinely has that experience", never a fabricated number/example), priority.

STEP 9 — recommendations (top improvements, ranked by estimated impact on this specific JD match — 3-7 items, fewer if there's genuinely little to recommend):
Each: priority, issue (what's holding the score back), why (why it matters for this JD), jdRequirements (which specific JD requirements from step 6 this addresses), action (a concrete next step). Recommendations must be honest and non-fabricating: if the action implies adding experience/skills the resume doesn't currently show, phrase it conditionally — "If you have X experience, make it explicit in the relevant section" / "If applicable, add your exposure to X" — never a bare "Add X" that could be read as an instruction to invent it.

STEP 10 — summary:
strengths (what's genuinely working, grounded in the analysis above), weaknesses (what's genuinely weak, grounded in the analysis above), biggestOpportunity (one sentence naming the single highest-impact fix). Do not state or imply an exact point-value score improvement (e.g. never "+12 points") unless you are certain — prefer qualitative framing ("addressing this would meaningfully improve keyword match").

Respond only with JSON matching the required schema — no prose, no markdown fences.

RESUME CONTENT (JSON):
{json.dumps(resume_content, indent=2)}

JOB DESCRIPTION:
{job_description}
"""


def analyze(request: AnalyzeRequest) -> AtsAnalysisResult:
    prompt = build_prompt(request.resumeContent, request.jobDescription)
    response = _generate_with_fallback(prompt, AtsAnalysisResult)

    raw_text = (response.text or "").strip()
    if not raw_text:
        raise ValueError("Gemini returned an empty response")

    return response.parsed


def build_improve_prompt(resume_content: dict, job_description: str, analysis: AtsAnalysisResult) -> str:
    experience_ids = [item.get("id") for item in resume_content.get("experience", []) if isinstance(item, dict)]
    skill_groups = [
        {"id": g.get("id"), "category": g.get("category"), "items": g.get("items", [])}
        for g in resume_content.get("skills", [])
        if isinstance(g, dict)
    ]

    return f"""You are helping a real job candidate improve their resume for a specific job application. You will propose concrete, truthful edits — not a rewrite, not an assessment.

ABSOLUTE RULE — TRUTHFULNESS:
You may ONLY rephrase, reframe, or better-articulate things the candidate has already stated about themselves in the resume below. You may NEVER:
- invent a company, job title, employment date, degree, or project that isn't already in the resume
- invent a metric, number, percentage, or outcome that isn't already stated or directly implied by existing text
- add a skill to the skills section unless it is genuinely evidenced elsewhere in the resume (explicitly named in an experience/project description, or a very close synonym of something explicitly named — e.g. "REST APIs" can be surfaced as a skill if a bullet already describes building REST APIs)
- change any dates, company names, job titles, or school names
If you cannot improve something truthfully, leave it unchanged — do not fabricate to fill a gap. It is better to propose a smaller, honest improvement than a larger dishonest one.

CURRENT RESUME (JSON):
{json.dumps(resume_content, indent=2)}

JOB DESCRIPTION:
{job_description}

CURRENT ATS ANALYSIS (what's weak right now):
- Overall score: {analysis.overallScore}
- Matched keywords: {json.dumps(analysis.keywordMatch.matched)}
- Missing keywords: {json.dumps(analysis.keywordMatch.missing)}
- Failed formatting checks: {json.dumps([c.label for c in analysis.formatting.checks if not c.passed])}
- Warnings: {json.dumps(analysis.warnings)}

EVERY proposed change (summaryUpdate, each experienceUpdates entry, each skillsToAdd entry) MUST carry a `meta` object:
- reason: 1-2 sentences explaining WHY this specific change helps, in plain language, referencing what it surfaces or clarifies.
- jdRequirement: the specific job-description requirement/keyword this change addresses (short phrase, e.g. "Process optimization"). Empty string if the change is a general clarity improvement not tied to one specific JD requirement.
- changeTypes: one or more of exactly these values: {json.dumps(CHANGE_TYPES)}.
- confidence: 0-100 — how confident you are that this change is supported by EXISTING evidence already in the resume and genuinely relevant to the JD. This is NOT about how good the writing sounds. High confidence (80-100): the resume already explicitly states the fact/skill being surfaced and the JD explicitly asks for it. Medium (40-79): the resume implies it or the JD relevance is indirect. Low (0-39): weak textual support — prefer NOT proposing the change at all rather than proposing a low-confidence one; only include a low-confidence change if you have no better option and clearly flag it as such via the reason text.

YOUR TASK — propose edits limited to exactly these three kinds, each optional:

1. summaryUpdate: A rewritten Professional Summary that better surfaces the candidate's REAL, already-stated experience relevant to this job description (e.g. weaving in missing keywords the candidate's actual background already supports). Set to null/omit if the current summary needs no change or there's nothing truthful to add.

2. experienceUpdates: For experience entries where the description is thin, generic, or could better surface real relevant work, propose a rewritten description. You are given each entry's exact id below — use it exactly, and only include entries you are actually changing:
{json.dumps(experience_ids)}
   Improvements can: rephrase generic filler ("Responsible for X") into a specific, active-voice statement using details already in the text; surface a real metric that's already stated but buried or not emphasized; better align the phrasing/terminology with the job description's language WITHOUT changing what was actually done. Do not add a metric, tool, or outcome that isn't already in the original description.

3. skillsToAdd: Existing skill groups are:
{json.dumps(skill_groups, indent=2)}
   For each skill genuinely evidenced elsewhere in the resume (in an experience or project description) but missing from the skills section, propose adding it. Set groupId to an existing group's id from the list above if it fits there, or leave groupId as "" and set category to a new, sensible group name if none fits. Only include groups where itemsToAdd is non-empty. Do not propose skills with no basis in the resume text.

4. changeNotes: 1-3 short, plain-language sentences summarizing what you changed and why (e.g. "Rewrote the Acme Corp bullet to lead with the API work and surface the 40% latency improvement already mentioned."). If you are proposing no changes at all, say so honestly and explain why (e.g. the resume already truthfully represents everything relevant).

Respond only with JSON matching the required schema — no prose, no markdown fences.
"""


def propose_improvement(resume_content: dict, job_description: str, analysis: AtsAnalysisResult) -> ImprovementProposal:
    prompt = build_improve_prompt(resume_content, job_description, analysis)
    response = _generate_with_fallback(prompt, ImprovementProposal)

    if response.parsed is None:
        raise ValueError("Gemini response did not match the expected schema")

    return response.parsed


def apply_proposal(resume_content: dict, proposal: ImprovementProposal) -> dict:
    """
    Merges a proposal onto a copy of the resume content. Deliberately only
    ever touches personal.summary, experience[].description, and
    skills[].items — every other field (company, dates, titles, ids, etc.)
    is untouched, which is what makes the truthfulness rule enforceable in
    code rather than relying purely on the prompt.
    """
    next_content = copy.deepcopy(resume_content)

    if proposal.summaryUpdate and proposal.summaryUpdate.text.strip():
        next_content.setdefault("personal", {})["summary"] = proposal.summaryUpdate.text.strip()

    experience_by_id = {
        item.get("id"): item for item in next_content.get("experience", []) if isinstance(item, dict)
    }
    for update in proposal.experienceUpdates:
        target = experience_by_id.get(update.id)
        if target is not None and update.description.strip():
            target["description"] = update.description.strip()

    skills = next_content.setdefault("skills", [])
    skills_by_id = {g.get("id"): g for g in skills if isinstance(g, dict)}
    for addition in proposal.skillsToAdd:
        items_to_add = [s.strip() for s in addition.itemsToAdd if s and s.strip()]
        if not items_to_add:
            continue

        group = skills_by_id.get(addition.groupId) if addition.groupId else None
        if group is None:
            # Fall back to matching an existing group by category name
            # (case-insensitive) before creating a brand-new one, in case
            # Gemini named a real group instead of using its id.
            group = next(
                (
                    g
                    for g in skills
                    if isinstance(g, dict) and g.get("category", "").strip().lower() == addition.category.strip().lower()
                ),
                None,
            )

        if group is not None:
            existing = set(group.get("items", []))
            group["items"] = group.get("items", []) + [s for s in items_to_add if s not in existing]
        else:
            new_group = {
                "id": f"skill_{uuid.uuid4().hex[:8]}",
                "category": addition.category.strip() or "Additional Skills",
                "items": items_to_add,
            }
            skills.append(new_group)
            skills_by_id[new_group["id"]] = new_group

    return next_content


def improve_and_rescore(request: ImproveRequest) -> ImproveResult:
    """
    Runs the propose -> merge -> rescore loop: up to `maxIterations` rounds,
    stopping early once `targetScore` is reached. Each round costs two
    Gemini calls (propose_improvement + analyze), so a full 3-round run
    costs up to 6 calls — see atsController.js for how this is gated.
    """
    original_content = request.resumeContent
    content = copy.deepcopy(original_content)

    analysis = request.currentAnalysis
    if analysis is None:
        analysis = analyze(AnalyzeRequest(resumeContent=content, jobDescription=request.jobDescription))

    score_history = [analysis.overallScore]
    all_notes: list[str] = []
    all_changes: list[ProposedChange] = []
    iterations = 0

    while iterations < request.maxIterations and analysis.overallScore < request.targetScore:
        proposal = propose_improvement(content, request.jobDescription, analysis)
        content = apply_proposal(content, proposal)
        analysis = analyze(AnalyzeRequest(resumeContent=content, jobDescription=request.jobDescription))
        score_history.append(analysis.overallScore)
        all_notes.extend(proposal.changeNotes)
        all_changes.extend(_flatten_proposal_changes(proposal))
        iterations += 1

    return ImproveResult(
        originalContent=original_content,
        proposedContent=content,
        initialScore=score_history[0],
        finalScore=score_history[-1],
        iterations=iterations,
        scoreHistory=score_history,
        finalAnalysis=analysis,
        changeNotes=all_notes,
        changes=all_changes,
    )


def _flatten_proposal_changes(proposal: ImprovementProposal) -> list[ProposedChange]:
    """
    Converts one iteration's ImprovementProposal into the flat, explainable
    ProposedChange records the frontend renders alongside its own
    independently-computed before/after diff. If the same field is touched
    across multiple iterations, later entries are appended after earlier
    ones — the frontend takes the LAST matching entry per type+targetId,
    matching apply_proposal's own last-write-wins behavior.
    """
    changes: list[ProposedChange] = []
    if proposal.summaryUpdate and proposal.summaryUpdate.text.strip():
        changes.append(ProposedChange(type="summary", meta=proposal.summaryUpdate.meta))
    for update in proposal.experienceUpdates:
        if update.description.strip():
            changes.append(ProposedChange(type="experience", targetId=update.id, meta=update.meta))
    for addition in proposal.skillsToAdd:
        if any(s.strip() for s in addition.itemsToAdd):
            changes.append(
                ProposedChange(type="skills", targetId=addition.groupId, category=addition.category, meta=addition.meta)
            )
    return changes


def build_extract_prompt(text: str) -> str:
    return f"""You are extracting structured data from a CV/resume's plain text so it can be imported into a resume-builder application. The text below was mechanically extracted from a PDF or DOCX file, so formatting (line breaks, spacing, bullet characters) may be imperfect — read past that and focus on the actual content.

ABSOLUTE RULE — NO INVENTION:
You are a transcriber, not a writer. Every value you output MUST be literally present in (or an unambiguous direct restatement of) the source text below. You must NEVER:
- invent, guess, or infer a company name, job title, date, degree, university, technology, achievement, metric, or certification that is not explicitly stated in the text
- fill in a plausible-sounding value for a field the text doesn't clearly state
- "improve", rephrase for impact, or embellish any description — copy/lightly clean up the candidate's own wording, don't rewrite it
- merge or split entries in a way not supported by the text (e.g. don't invent two jobs from one, or combine two distinct jobs into one)
If a field is not clearly present in the text, leave it as an empty string "" (or an empty list for array fields, or false for booleans) — an honest empty field is always correct; a confident-looking guess is always wrong. This is more important than completeness.

FIELDS TO EXTRACT:

personal: fullName, email, phone, location, linkedin (URL or handle), github (URL or handle), portfolio (URL), summary (a professional summary/objective paragraph ONLY if one is literally written in the CV — do not compose one from other sections if it's absent).

experience: one entry per job, each with company, role (job title), location, startDate, endDate (use the literal text as written, e.g. "Jan 2020", "2020-01", "2022"; if the entry says "Present"/"Current"/"Ongoing", set endDate to "" and current to true), description (the job's bullet points/duties, joined as one block of text — do not summarize or shorten them).

education: one entry per school/qualification, each with degree, school (institution name), location, startDate, endDate, description (only if the CV states something extra like honors, GPA, or relevant coursework — otherwise "").

projects: one entry per project mentioned, each with name, techStack (technologies/tools literally named for that project, comma-separated), link (a URL if one is given), description.

skills: group skills the way the CV groups them if it has explicit categories (e.g. "Languages", "Frameworks", "Tools"); if the CV just lists skills with no categories, put them all in one group with category "Skills". Each item in `items` must be a skill/tool/technology literally named in the text — do not add related skills that aren't mentioned.

certifications: one entry per certification/license mentioned, each with name, issuer (the organization that issued it, if stated), date (if stated).

If the text doesn't look like a CV/resume at all (e.g. it's some other kind of document, or extraction produced garbage), still return the schema with every field empty — do not fabricate a resume from nothing.

Respond only with JSON matching the required schema — no prose, no markdown fences.

EXTRACTED CV TEXT:
{text}
"""


def extract_resume(text: str) -> ExtractedResume:
    """
    Single Gemini call (via the same fallback chain as everything else in
    this module) that turns plain CV text into ExtractedResume — the CV
    upload feature's only AI call, deliberately kept to exactly one call
    per upload to stay within the project's shared free-tier daily budget
    (see ATS_CHECK/IMPROVE/UPLOAD *_DAILY_GLOBAL_LIMIT in atsController.js
    on the Node side, which is what actually enforces the budget; this
    function has no retry-on-failure beyond the model fallback already
    built into _generate_with_fallback, so a bad Gemini response surfaces
    immediately as an error rather than silently burning extra calls).
    """
    prompt = build_extract_prompt(text)
    response = _generate_with_fallback(prompt, ExtractedResume)

    if response.parsed is None:
        raise ValueError("Gemini response did not match the expected resume schema")

    return response.parsed

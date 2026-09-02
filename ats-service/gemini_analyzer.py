"""
Calls Gemini to score a resume against a job description, using structured
JSON output so the response is guaranteed to match AtsAnalysisResult
instead of being free text that has to be parsed out with regex.
"""

import copy
import json
import os
import uuid

from google import genai
from google.genai import types

from models import (
    AnalyzeRequest,
    AtsAnalysisResult,
    ImprovementProposal,
    ImproveRequest,
    ImproveResult,
)

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

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
        _client = genai.Client(api_key=api_key)
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

Respond only with JSON matching the required schema — no prose, no markdown fences.

RESUME CONTENT (JSON):
{json.dumps(resume_content, indent=2)}

JOB DESCRIPTION:
{job_description}
"""


def analyze(request: AnalyzeRequest) -> AtsAnalysisResult:
    client = get_client()
    prompt = build_prompt(request.resumeContent, request.jobDescription)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AtsAnalysisResult,
        ),
    )

    if response.parsed is None:
        raise ValueError("Gemini response did not match the expected schema")

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

YOUR TASK — propose edits limited to exactly these three kinds, each optional:

1. summary: A rewritten Professional Summary that better surfaces the candidate's REAL, already-stated experience relevant to this job description (e.g. weaving in missing keywords the candidate's actual background already supports). Leave as an empty string "" if the current summary needs no change or there's nothing truthful to add.

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
    client = get_client()
    prompt = build_improve_prompt(resume_content, job_description, analysis)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ImprovementProposal,
        ),
    )

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

    if proposal.summary and proposal.summary.strip():
        next_content.setdefault("personal", {})["summary"] = proposal.summary.strip()

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
    iterations = 0

    while iterations < request.maxIterations and analysis.overallScore < request.targetScore:
        proposal = propose_improvement(content, request.jobDescription, analysis)
        content = apply_proposal(content, proposal)
        analysis = analyze(AnalyzeRequest(resumeContent=content, jobDescription=request.jobDescription))
        score_history.append(analysis.overallScore)
        all_notes.extend(proposal.changeNotes)
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
    )

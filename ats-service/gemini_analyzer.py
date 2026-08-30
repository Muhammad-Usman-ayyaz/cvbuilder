"""
Calls Gemini to score a resume against a job description, using structured
JSON output so the response is guaranteed to match AtsAnalysisResult
instead of being free text that has to be parsed out with regex.
"""

import json
import os

from google import genai
from google.genai import types

from models import AnalyzeRequest, AtsAnalysisResult

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

STEP 1 — keywordMatch (strict matching only):
Extract the meaningful skills, tools, technologies, and explicit requirements stated in the job description (ignore filler words like "team player" or "fast-paced environment" unless the JD frames them as a hard requirement). For each extracted keyword, mark it "matched" ONLY if it is:
   - stated explicitly in the resume, OR
   - a clear, unambiguous equivalent already present (e.g. "JS" ⇄ "JavaScript", "Node" ⇄ "Node.js", "K8s" ⇄ "Kubernetes")
Do NOT count a keyword as matched based on: a related-but-different skill, general seniority/experience level, industry proximity, or "the candidate could probably do this." If you are not confident it's genuinely present, mark it missing. Err toward missing, not matched.
   - score: 0-100, computed as (count of matched keywords / total extracted keywords) × 100, rounded to the nearest integer
   - matched: the exact keywords/phrases found
   - missing: the exact keywords/phrases not found — this list must be genuinely absent from the resume, not borderline cases

STEP 2 — formatting (concrete, consistent pass/fail criteria — apply these definitions exactly, do not substitute your own judgment):
   - "Contact info present": resume has both an email address and a phone number.
   - "Professional summary present": a summary/objective field exists and contains at least one non-trivial sentence (not empty, not a placeholder like "TODO" or "N/A").
   - "Experience section exists": at least one work experience entry is present.
   - "Experience entries have dates": every experience entry has both a start date and an end date (or "Present"/current).
   - "Experience entries have real descriptions": every experience entry has a non-empty description of at least ~10 words describing actual duties or work — not just a job title repeated.
   - "Quantified achievements present": at least one experience entry description contains a measurable result (a number, percentage, dollar amount, or explicit metric — e.g. "increased conversion by 20%", "managed a team of 5"). Fail this check if descriptions are all purely qualitative with no numbers/metrics anywhere.
   - "Education section exists": at least one education entry is present.
   - "Skills section has real items": a skills section exists and lists at least 3 concrete, specific items (not vague terms like "hard worker").
   - Add further checks only if something concrete and objectively verifiable stands out (e.g. clearly inconsistent date formats, overlapping employment dates that don't make sense). Do not add vague/subjective checks.
For each check, set passed strictly per the definition above, and give a one-sentence factual note (what you actually found, not a suggestion).

STEP 3 — overallScore formula (only when the job description passed the validity check in step 0):
Compute overallScore as: (keywordMatch.score × 0.7) + (formattingScore × 0.3), rounded to the nearest integer, where formattingScore = (count of passed formatting checks / total formatting checks) × 100.
Do not deviate from this formula or adjust the result based on a subjective "feel" for the resume — a resume with 0% keyword match and perfect formatting should score around 30 (0×0.7 + 100×0.3), not higher.

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

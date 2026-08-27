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
    return f"""You are an ATS (Applicant Tracking System) resume analyzer. Compare the resume against the job description and produce a structured analysis.

Score two independent things:

1. keywordMatch — extract the meaningful skills, tools, and requirements mentioned in the job description (ignore filler words), then determine which of them are genuinely reflected in the resume's content (treat close variants/synonyms and common abbreviations as the same thing, e.g. "JS" and "JavaScript", "Node" and "Node.js"). Return:
   - score: 0-100, the percentage of extracted keywords found in the resume
   - matched: the keywords/phrases that were found
   - missing: the keywords/phrases that were not found

2. formatting — assess the resume's structural/ATS-friendliness as a list of pass/fail checks with a short explanatory note each. At minimum, evaluate: contact information present (email and phone), a professional summary is present, an experience section exists, experience entries have start/end dates, experience entries have real (non-empty) descriptions, an education section exists, and a skills section with actual items exists. Add other relevant structural checks if something stands out (e.g. inconsistent dates, no measurable achievements).

Then compute:
- overallScore: 0-100, a reasonable weighted combination of the keyword match and formatting quality (weight keyword match more heavily, since it's specific to this job application)
- warnings: short, plain-language warnings when appropriate — e.g. if the resume is essentially empty (no real experience/education/skills content), or if the job description is too short/thin to meaningfully extract keywords from. Return an empty list if nothing is concerning.

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

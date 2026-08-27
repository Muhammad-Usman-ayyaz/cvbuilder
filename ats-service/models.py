"""
Pydantic models for the /analyze endpoint.

The response models define the exact contract the Node backend (and, in
turn, the frontend's AtsResults.jsx) already expects — this schema is also
handed to Gemini directly as structured-output config, so the model's
response is guaranteed to parse into these shapes instead of needing to be
regex'd out of free text.
"""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    # Left as a loosely-typed dict rather than a strict nested model: the
    # frontend's resume shape has a couple of legacy quirks (e.g. linkedin/
    # github/portfolio can be a plain string OR a {label, url} object) that
    # don't matter for prompting Gemini, so there's no value in keeping a
    # second, stricter copy of that shape in sync here.
    resumeContent: Dict[str, Any]
    jobDescription: str


class FormattingCheck(BaseModel):
    label: str
    passed: bool
    note: str


class Formatting(BaseModel):
    checks: List[FormattingCheck]


class KeywordMatch(BaseModel):
    score: int = Field(ge=0, le=100)
    matched: List[str]
    missing: List[str]


class AtsAnalysisResult(BaseModel):
    overallScore: int = Field(ge=0, le=100)
    keywordMatch: KeywordMatch
    formatting: Formatting
    warnings: List[str]

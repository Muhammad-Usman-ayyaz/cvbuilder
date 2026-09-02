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


class ExperienceImprovement(BaseModel):
    id: str
    description: str


class SkillsAddition(BaseModel):
    # groupId names an EXISTING skills group from the resume to append to.
    # Left empty when proposing a brand-new group — category is then used
    # as that new group's name. Never used to invent a skill with no basis
    # in the original resume; see the prompt for the truthfulness rule.
    groupId: str
    category: str
    itemsToAdd: List[str]


class ImprovementProposal(BaseModel):
    # Empty string means "no change to the summary".
    summary: str
    experienceUpdates: List[ExperienceImprovement]
    skillsToAdd: List[SkillsAddition]
    # Short, human-readable notes on what changed and why — shown to the
    # user alongside the diff so the reasoning isn't a black box.
    changeNotes: List[str]


class ImproveRequest(BaseModel):
    resumeContent: Dict[str, Any]
    jobDescription: str
    # The Node backend already has the most recent analysis for this
    # resume/JD pair (from the /analyze call the user just ran) — passing
    # it in skips one redundant Gemini call for the starting score.
    currentAnalysis: AtsAnalysisResult | None = None
    maxIterations: int = Field(default=3, ge=1, le=3)
    targetScore: int = Field(default=95, ge=0, le=100)


class ImproveResult(BaseModel):
    originalContent: Dict[str, Any]
    proposedContent: Dict[str, Any]
    initialScore: int
    finalScore: int
    iterations: int
    scoreHistory: List[int]
    finalAnalysis: AtsAnalysisResult
    changeNotes: List[str]

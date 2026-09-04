"""
Pydantic models for the /analyze endpoint.

The response models define the exact contract the Node backend (and, in
turn, the frontend's AtsResults.jsx) already expects — this schema is also
handed to Gemini directly as structured-output config, so the model's
response is guaranteed to parse into these shapes instead of needing to be
regex'd out of free text.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

Priority = Literal["high", "medium", "low"]


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


class ScoreCategory(BaseModel):
    score: int = Field(ge=0, le=100)
    label: str
    explanation: str
    evidence: List[str] = Field(default_factory=list)
    # Phrased as "not found/demonstrated in the CV" — never "you don't have
    # X" — see build_prompt's instructions; this is the missing≠doesn't-have
    # distinction the report UI depends on.
    missing: List[str] = Field(default_factory=list)
    priority: Priority = "medium"


class ScoreBreakdown(BaseModel):
    keywordMatch: ScoreCategory
    skillsAlignment: ScoreCategory
    experienceRelevance: ScoreCategory
    educationAlignment: ScoreCategory
    titleAlignment: ScoreCategory
    formatting: ScoreCategory
    achievements: ScoreCategory
    overallRelevance: ScoreCategory


class RequirementItem(BaseModel):
    text: str
    # None/"" when nothing was found — evidence text must never claim the
    # candidate lacks something, only that the CV doesn't demonstrate it.
    evidence: str = ""
    isPreferred: bool = False


class Requirements(BaseModel):
    matched: List[RequirementItem] = Field(default_factory=list)
    partial: List[RequirementItem] = Field(default_factory=list)
    missing: List[RequirementItem] = Field(default_factory=list)
    preferred: List[RequirementItem] = Field(default_factory=list)


class KeywordAnalysis(BaseModel):
    matched: List[str] = Field(default_factory=list)
    partial: List[str] = Field(default_factory=list)
    missingHighPriority: List[str] = Field(default_factory=list)
    missingMediumPriority: List[str] = Field(default_factory=list)


class ContentIssue(BaseModel):
    issue: str
    evidence: str
    whyItMatters: str
    suggestion: str
    priority: Priority = "medium"


class Recommendation(BaseModel):
    priority: Priority = "medium"
    issue: str
    why: str
    jdRequirements: List[str] = Field(default_factory=list)
    action: str


class ReportSummary(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    biggestOpportunity: str = ""


class AtsAnalysisResult(BaseModel):
    overallScore: int = Field(ge=0, le=100)
    keywordMatch: KeywordMatch
    formatting: Formatting
    warnings: List[str]
    # Everything below is additive — kept optional so any historical
    # ats_checks.result_json row (or any code path that ever constructs
    # this model without them) still validates. The frontend treats an
    # absent value here as "legacy report, show the fallback sections only".
    scoreBreakdown: Optional[ScoreBreakdown] = None
    requirements: Optional[Requirements] = None
    keywords: Optional[KeywordAnalysis] = None
    contentIssues: Optional[List[ContentIssue]] = None
    recommendations: Optional[List[Recommendation]] = None
    summary: Optional[ReportSummary] = None


# Fixed vocabulary for ImprovementProposal.*.changeTypes — a change can
# have more than one. Kept as a plain str (not Literal) in the field type so
# an unrecognized value from Gemini doesn't fail schema validation; the
# prompt is what actually constrains the model to this vocabulary.
CHANGE_TYPES = [
    "keyword-alignment",
    "clarity",
    "relevance",
    "achievement-framing",
    "action-verb",
    "technical-terminology",
    "summary-alignment",
    "skill-alignment",
]


class ChangeMeta(BaseModel):
    """
    Explainability metadata attached to every proposed change. `confidence`
    means how strongly the change is supported by EXISTING resume evidence
    and relevant to the JD — not how good the writing sounds (see
    build_improve_prompt's instructions). Kept as its own model and
    inlined (not a separate list keyed by id) so each concrete change type
    below carries its own explanation right next to what it's changing.
    """

    reason: str
    jdRequirement: str = ""
    changeTypes: List[str] = Field(default_factory=list)
    confidence: int = Field(ge=0, le=100, default=50)


class SummaryImprovement(BaseModel):
    text: str
    meta: ChangeMeta


class ExperienceImprovement(BaseModel):
    id: str
    description: str
    meta: ChangeMeta


class SkillsAddition(BaseModel):
    # groupId names an EXISTING skills group from the resume to append to.
    # Left empty when proposing a brand-new group — category is then used
    # as that new group's name. Never used to invent a skill with no basis
    # in the original resume; see the prompt for the truthfulness rule.
    groupId: str
    category: str
    itemsToAdd: List[str]
    meta: ChangeMeta


class ImprovementProposal(BaseModel):
    # None means "no change to the summary" (kept optional rather than the
    # old empty-string sentinel so a real summary change always carries its
    # ChangeMeta alongside it).
    summaryUpdate: Optional[SummaryImprovement] = None
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


class ProposedChange(BaseModel):
    """
    Flattened, explainable record of one applied change — one per
    summary/experience/skills-group touched across all improve_and_rescore
    iterations, in application order. The frontend matches these to the
    before/after it computes itself (diffing originalContent vs
    proposedContent by type+targetId) rather than trusting text here, so
    this is purely the "why" layer alongside a diff the frontend already
    verifies independently.
    """

    type: Literal["summary", "experience", "skills"]
    targetId: str = ""  # experience entry id, or skills group id; "" for summary
    category: str = ""  # skills only — the group's category name
    meta: ChangeMeta


class ImproveResult(BaseModel):
    originalContent: Dict[str, Any]
    proposedContent: Dict[str, Any]
    initialScore: int
    finalScore: int
    iterations: int
    scoreHistory: List[int]
    finalAnalysis: AtsAnalysisResult
    changeNotes: List[str]
    changes: List[ProposedChange] = Field(default_factory=list)


# ---------------------------------------------------------------------
# /extract — CV upload structured extraction.
#
# Every field is optional/nullable and defaults to "" or []: the extraction
# rule (see gemini_analyzer.build_extract_prompt) is that Gemini must NEVER
# invent a value it isn't confident is literally present in the source
# text — an empty/missing field is the correct, honest output when the
# document doesn't clearly state something, not a failure. The Node backend
# treats "empty after extraction" as the signal to highlight that field in
# the review screen, so no separate confidence score is needed here.
# ---------------------------------------------------------------------


class ExtractRequest(BaseModel):
    text: str


class ExtractedPersonal(BaseModel):
    fullName: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    summary: str = ""


class ExtractedExperience(BaseModel):
    company: str = ""
    role: str = ""
    location: str = ""
    startDate: str = ""
    endDate: str = ""
    current: bool = False
    description: str = ""


class ExtractedEducation(BaseModel):
    degree: str = ""
    school: str = ""
    location: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""


class ExtractedProject(BaseModel):
    name: str = ""
    techStack: str = ""
    link: str = ""
    description: str = ""


class ExtractedSkillGroup(BaseModel):
    category: str = ""
    items: List[str] = Field(default_factory=list)


class ExtractedCertification(BaseModel):
    name: str = ""
    issuer: str = ""
    date: str = ""


class ExtractedResume(BaseModel):
    personal: ExtractedPersonal
    experience: List[ExtractedExperience] = Field(default_factory=list)
    education: List[ExtractedEducation] = Field(default_factory=list)
    projects: List[ExtractedProject] = Field(default_factory=list)
    skills: List[ExtractedSkillGroup] = Field(default_factory=list)
    certifications: List[ExtractedCertification] = Field(default_factory=list)

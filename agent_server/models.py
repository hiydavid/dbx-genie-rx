import re

from pydantic import BaseModel, Field, field_validator

# Genie Space ID format: alphanumeric, hyphens, underscores (max 64 chars)
_GENIE_SPACE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9\-_]{1,64}$")

# Maximum length for user text fields
MAX_TEXT_LENGTH = 10000
MAX_FEEDBACK_LENGTH = 2000


class AgentInput(BaseModel):
    """Input for the Genie Space Analyzer agent."""

    genie_space_id: str = Field(..., min_length=1, max_length=64)

    @field_validator("genie_space_id")
    @classmethod
    def validate_genie_space_id(cls, v: str) -> str:
        if not _GENIE_SPACE_ID_PATTERN.match(v):
            raise ValueError(
                "genie_space_id must contain only alphanumeric characters, "
                "hyphens, and underscores (max 64 characters)"
            )
        return v


class ChecklistItem(BaseModel):
    """A single checklist item from the analysis."""

    id: str  # e.g., "at-least-1-table-is-configured"
    description: str  # Human-readable description
    passed: bool  # Whether the check passed
    details: str | None = None  # Additional context (e.g., "Found 3 tables")


class Finding(BaseModel):
    """A single finding from the analysis."""

    category: str  # "best_practice", "warning", "suggestion"
    severity: str  # "high", "medium", "low"
    description: str
    recommendation: str
    reference: str  # Relevant best practice section


class SectionAnalysis(BaseModel):
    """Analysis results for a single section."""

    section_name: str  # e.g., "config.sample_questions", "data_sources.tables"
    checklist: list[ChecklistItem]  # Structured checklist results
    findings: list[Finding]  # Detailed findings for failed items
    score: int  # 0-10 compliance score (passed_items / total_items * 10)
    summary: str


class AgentOutput(BaseModel):
    """Output from the Genie Space Analyzer agent."""

    genie_space_id: str
    analyses: list[SectionAnalysis]
    overall_score: int
    trace_id: str


# Optimization models


class OptimizationSuggestion(BaseModel):
    """A single field-level optimization suggestion."""

    field_path: str  # e.g., "instructions.text_instructions[0].content"
    current_value: str | dict | list | None  # Current value
    suggested_value: str | dict | list | None  # Suggested new value
    rationale: str  # Why this change helps
    checklist_reference: str | None = None  # Related checklist item ID
    priority: str  # "high", "medium", "low"
    category: str  # instruction, sql_example, filter, expression, measure, etc.


class LabelingFeedbackItem(BaseModel):
    """A single labeling feedback item from the benchmark session."""

    question_text: str = Field(..., min_length=1, max_length=MAX_TEXT_LENGTH)
    is_correct: bool | None
    feedback_text: str | None = Field(None, max_length=MAX_FEEDBACK_LENGTH)


class OptimizationRequest(BaseModel):
    """Request to generate optimization suggestions."""

    genie_space_id: str = Field(..., min_length=1, max_length=64)
    space_data: dict
    labeling_feedback: list[LabelingFeedbackItem] = Field(..., max_length=100)

    @field_validator("genie_space_id")
    @classmethod
    def validate_genie_space_id(cls, v: str) -> str:
        if not _GENIE_SPACE_ID_PATTERN.match(v):
            raise ValueError(
                "genie_space_id must contain only alphanumeric characters, "
                "hyphens, and underscores (max 64 characters)"
            )
        return v


class OptimizationResponse(BaseModel):
    """Response containing optimization suggestions."""

    suggestions: list[OptimizationSuggestion]
    summary: str
    trace_id: str

import re
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class ConfigStyle(str, Enum):
    """Detected configuration style for a Genie Space."""

    METRIC_VIEWS_FOCUSED = "metric-views-focused"
    TABLES_WITH_KNOWLEDGE_BASE = "tables-with-knowledge-base"
    EXAMPLE_DRIVEN = "example-driven"
    MINIMAL_VIABLE = "minimal-viable"
    HYBRID = "hybrid"


class AssessmentCategory(str, Enum):
    """Qualitative assessment category replacing numeric scores."""

    GOOD_TO_GO = "good_to_go"
    QUICK_WINS = "quick_wins"
    FOUNDATION_NEEDED = "foundation_needed"


class StyleDetectionResult(BaseModel):
    """Result of heuristic-based configuration style detection."""

    detected_style: ConfigStyle
    confidence: float  # 0.0 to 1.0
    indicators: dict[str, Any]  # Counts and signals that led to the detection
    description: str  # Human-readable description of the detected style


class CompensatingStrength(BaseModel):
    """Represents how one section compensates for another's weakness."""

    covering_section: str  # Section providing the strength
    covered_section: str  # Section being compensated for
    explanation: str  # How the strength compensates


class SynthesisResult(BaseModel):
    """Cross-sectional synthesis result from analyzing all sections together."""

    assessment: AssessmentCategory
    assessment_rationale: str
    compensating_strengths: list[CompensatingStrength]
    celebration_points: list[str]  # What's working well
    top_quick_wins: list[str]  # Actionable improvements

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
    style: StyleDetectionResult | None = None  # Detected config style
    synthesis: SynthesisResult | None = None  # Cross-sectional synthesis (full analysis only)
    overall_score: int  # Kept for backward compatibility
    trace_id: str


# Optimization models


class OptimizationSuggestion(BaseModel):
    """A single field-level optimization suggestion."""

    field_path: str  # e.g., "instructions.text_instructions[0].content"
    current_value: str | dict | list | bool | int | float | None  # Current value
    suggested_value: str | dict | list | bool | int | float | None  # Suggested new value
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


class ConfigMergeRequest(BaseModel):
    """Request to merge optimization suggestions into a config."""

    space_data: dict
    suggestions: list[OptimizationSuggestion]


class ConfigMergeResponse(BaseModel):
    """Response containing merged configuration."""

    merged_config: dict
    summary: str
    trace_id: str

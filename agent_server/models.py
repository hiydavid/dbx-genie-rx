from pydantic import BaseModel


class AgentInput(BaseModel):
    """Input for the Genie Space Analyzer agent."""

    genie_space_id: str


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

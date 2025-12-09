import json
import os
import uuid
from collections.abc import Generator
from pathlib import Path

import mlflow
from mlflow.entities import SpanType
from mlflow.genai.agent_server import invoke as invoke_decorator

from agent_server.auth import get_workspace_client
from agent_server.ingest import get_serialized_space
from agent_server.models import AgentInput, AgentOutput, Finding, SectionAnalysis
from agent_server.prompts import get_section_analysis_prompt

# Enable MLflow tracing
mlflow.tracing.enable()

# Sections to analyze (in order for future UI walkthrough)
SECTIONS = [
    "config.sample_questions",
    "data_sources.tables",
    "data_sources.metric_views",
    "instructions.text_instructions",
    "instructions.example_question_sqls",
    "instructions.sql_functions",
    "instructions.join_specs",
    "instructions.sql_snippets.filters",
    "instructions.sql_snippets.expressions",
    "instructions.sql_snippets.measures",
    "benchmarks.questions",
]


class GenieSpaceAnalyzer:
    """Analyzes Genie Space configurations against best practices."""

    def __init__(self):
        self.model = os.environ.get("LLM_MODEL", "databricks-claude-sonnet-4")
        self.best_practices = self._load_best_practices()
        self.schema_docs = self._load_schema_docs()
        self._session_id: str | None = None

    def _call_serving_endpoint(self, messages: list[dict]) -> str:
        """Call the LLM serving endpoint using the SDK's API client.

        Uses the SDK's api_client.do() which handles OBO authentication
        automatically on Databricks Apps.

        Args:
            messages: List of chat messages in OpenAI format

        Returns:
            The assistant's response content
        """
        client = get_workspace_client()

        response = client.api_client.do(
            method="POST",
            path=f"/serving-endpoints/{self.model}/invocations",
            body={
                "messages": messages,
            },
        )

        # Response is in OpenAI-compatible format
        return response["choices"][0]["message"]["content"]

    def start_session(self) -> str:
        """Start a new analysis session and return the session ID."""
        self._session_id = str(uuid.uuid4())
        return self._session_id

    def end_session(self):
        """Clear the current session."""
        self._session_id = None

    def _load_best_practices(self) -> str:
        """Load the best practices documentation."""
        docs_path = (
            Path(__file__).parent.parent / "docs" / "best-practices-by-schema.md"
        )
        return docs_path.read_text()

    def _load_schema_docs(self) -> str:
        """Load the schema documentation."""
        docs_path = Path(__file__).parent.parent / "docs" / "genie-space-schema.md"
        return docs_path.read_text()

    def _get_section_data(self, space: dict, section_path: str) -> dict | list | None:
        """Extract a section from the Genie space by dot-notation path."""
        parts = section_path.split(".")
        current = space
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current

    def _get_relevant_best_practices(self, section_name: str) -> str:
        """Extract best practices relevant to a specific section."""
        # Map section names to their headers in the best practices doc
        section_headers = {
            "config.sample_questions": "## `config`",
            "data_sources.tables": "### `tables`",
            "data_sources.metric_views": "### `metric_views`",
            "instructions.text_instructions": "### `text_instructions`",
            "instructions.example_question_sqls": "### `example_question_sqls`",
            "instructions.sql_functions": "### `sql_functions`",
            "instructions.join_specs": "### `join_specs`",
            "instructions.sql_snippets.filters": "#### `filters`",
            "instructions.sql_snippets.expressions": "#### `expressions`",
            "instructions.sql_snippets.measures": "#### `measures`",
            "benchmarks.questions": "## `benchmarks`",
        }

        header = section_headers.get(section_name, "")
        if not header:
            return self.best_practices

        # Find the section in the best practices doc
        lines = self.best_practices.split("\n")
        in_section = False
        section_lines = []

        for line in lines:
            if line.startswith(header):
                in_section = True
                section_lines.append(line)
            elif in_section:
                # Stop at the next section of same or higher level
                if line.startswith("## ") or (
                    line.startswith("### ") and header.startswith("### ")
                ):
                    break
                section_lines.append(line)

        return "\n".join(section_lines) if section_lines else self.best_practices

    @mlflow.trace(span_type=SpanType.LLM)
    def analyze_section(
        self, section_name: str, section_data: dict | list
    ) -> SectionAnalysis:
        """Analyze a single section against best practices."""
        # Tag trace with session ID if there's an active trace
        if self._session_id and mlflow.get_current_active_span() is not None:
            try:
                mlflow.update_current_trace(
                    metadata={
                        "mlflow.trace.session": self._session_id,
                    }
                )
            except Exception:
                pass  # Ignore if trace update fails

        relevant_practices = self._get_relevant_best_practices(section_name)
        prompt = get_section_analysis_prompt(
            section_name, relevant_practices, section_data
        )

        # Call serving endpoint using SDK (handles OBO auth automatically)
        content = self._call_serving_endpoint(
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse response, handling potential markdown code blocks
        content = content.strip()
        if content.startswith("```"):
            # Remove markdown code fences
            lines = content.split("\n")
            content = (
                "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])
            )
        result = json.loads(content)

        findings = [Finding(**f) for f in result.get("findings", [])]

        return SectionAnalysis(
            section_name=section_name,
            findings=findings,
            score=result.get("score", 0),
            summary=result.get("summary", ""),
        )

    @mlflow.trace(name="predict", span_type=SpanType.AGENT)
    def predict(self, inputs: list[AgentInput]) -> list[AgentOutput]:
        """Main entry point for the agent."""
        self.start_session()
        try:
            outputs = []

            for agent_input in inputs:
                genie_space_id = agent_input.genie_space_id

                # Fetch the Genie space
                with mlflow.start_span(name="fetch_genie_space") as span:
                    span.set_inputs({"genie_space_id": genie_space_id})
                    space = get_serialized_space(genie_space_id)
                    span.set_outputs({"keys": list(space.keys())})

                # Analyze each section sequentially
                analyses = []
                total_score = 0
                section_count = 0

                for section_name in SECTIONS:
                    section_data = self._get_section_data(space, section_name)

                    if section_data is not None:
                        with mlflow.start_span(name=f"analyze_{section_name}") as span:
                            span.set_inputs({"section_name": section_name})
                            analysis = self.analyze_section(section_name, section_data)
                            analyses.append(analysis)
                            total_score += analysis.score
                            section_count += 1
                            span.set_outputs(
                                {
                                    "score": analysis.score,
                                    "findings_count": len(analysis.findings),
                                }
                            )

                overall_score = total_score // section_count if section_count > 0 else 0
                trace_id = (
                    mlflow.get_current_active_span().request_id
                    if mlflow.get_current_active_span()
                    else ""
                )

                outputs.append(
                    AgentOutput(
                        genie_space_id=genie_space_id,
                        analyses=analyses,
                        overall_score=overall_score,
                        trace_id=trace_id,
                    )
                )

            return outputs
        finally:
            self.end_session()

    def get_sections_with_data(self, space: dict) -> list[tuple[str, dict | list]]:
        """Get list of sections that have data in the space.

        Args:
            space: The serialized Genie space

        Returns:
            List of (section_name, section_data) tuples
        """
        sections_with_data = []
        for section_name in SECTIONS:
            section_data = self._get_section_data(space, section_name)
            if section_data is not None:
                sections_with_data.append((section_name, section_data))
        return sections_with_data

    def predict_streaming(
        self, agent_input: AgentInput
    ) -> Generator[dict, None, AgentOutput]:
        """Streaming version of predict that yields progress updates.

        Yields dicts with progress info, then returns the final AgentOutput.
        Note: Session should be started before calling this method (e.g., via start_session()).
        """
        genie_space_id = agent_input.genie_space_id

        # Start session if not already active
        if not self._session_id:
            self.start_session()

        # Create a trace for the entire streaming operation
        with mlflow.start_span(
            name="predict_streaming", span_type=SpanType.AGENT
        ) as root_span:
            root_span.set_inputs({"genie_space_id": genie_space_id})

            try:
                # Fetch the Genie space
                yield {"status": "fetching", "message": "Fetching Genie space..."}
                with mlflow.start_span(name="fetch_genie_space") as span:
                    span.set_inputs({"genie_space_id": genie_space_id})
                    space = get_serialized_space(genie_space_id)
                    span.set_outputs({"keys": list(space.keys())})

                # Analyze each section sequentially
                analyses = []
                total_score = 0
                section_count = 0

                # First, determine which sections have data to get accurate total
                sections_with_data = [
                    (name, self._get_section_data(space, name)) for name in SECTIONS
                ]
                sections_with_data = [
                    (name, data)
                    for name, data in sections_with_data
                    if data is not None
                ]
                total_sections = len(sections_with_data)

                for i, (section_name, section_data) in enumerate(sections_with_data, 1):
                    yield {
                        "status": "analyzing",
                        "section": section_name,
                        "current": i,
                        "total": total_sections,
                        "message": f"Analyzing {section_name}...",
                    }

                    with mlflow.start_span(name=f"analyze_{section_name}") as span:
                        span.set_inputs({"section_name": section_name})
                        analysis = self.analyze_section(section_name, section_data)
                        analyses.append(analysis)
                        total_score += analysis.score
                        section_count += 1
                        span.set_outputs(
                            {
                                "score": analysis.score,
                                "findings_count": len(analysis.findings),
                            }
                        )

                overall_score = total_score // section_count if section_count > 0 else 0
                trace_id = root_span.request_id if root_span else None

                yield {"status": "complete", "message": "Analysis complete!"}

                # Set outputs on root span
                root_span.set_outputs(
                    {
                        "overall_score": overall_score,
                        "sections_analyzed": section_count,
                    }
                )

                return AgentOutput(
                    genie_space_id=genie_space_id,
                    analyses=analyses,
                    overall_score=overall_score,
                    trace_id=trace_id or "",
                )
            finally:
                self.end_session()


OUTPUT_DIR = Path(__file__).parent.parent / "output"


def _format_section_name(section_name: str) -> str:
    """Format section name for display in markdown."""
    return section_name.replace("_", " ").replace(".", " → ").title()


def format_analysis_as_markdown(output: AgentOutput) -> str:
    """Convert analysis output to a formatted markdown document.

    Args:
        output: The analysis output to format

    Returns:
        Formatted markdown string
    """
    lines = []

    # Title
    lines.append(f"# Genie Space Analysis Report")
    lines.append("")
    lines.append(f"**Space ID:** `{output.genie_space_id}`")
    lines.append("")

    # Overall Score
    lines.append("---")
    lines.append("")
    lines.append(f"## Overall Score: {output.overall_score}/10")
    lines.append("")

    # Summary Statistics
    total_findings = sum(len(a.findings) for a in output.analyses)
    high_count = sum(
        1 for a in output.analyses for f in a.findings if f.severity == "high"
    )
    medium_count = sum(
        1 for a in output.analyses for f in a.findings if f.severity == "medium"
    )
    low_count = sum(
        1 for a in output.analyses for f in a.findings if f.severity == "low"
    )

    lines.append("### Summary Statistics")
    lines.append("")
    lines.append(f"- **Total Findings:** {total_findings}")
    lines.append(f"- **High Severity:** {high_count}")
    lines.append(f"- **Medium Severity:** {medium_count}")
    lines.append(f"- **Low Severity:** {low_count}")
    lines.append(f"- **Sections Analyzed:** {len(output.analyses)}")
    lines.append("")

    # Section-by-section breakdown
    lines.append("---")
    lines.append("")
    lines.append("## Section Analysis")
    lines.append("")

    for analysis in output.analyses:
        display_name = _format_section_name(analysis.section_name)

        # Section header with score
        lines.append(f"### {display_name}")
        lines.append("")
        lines.append(f"**Score:** {analysis.score}/10")
        lines.append("")

        # Summary
        if analysis.summary:
            lines.append(f"**Summary:** {analysis.summary}")
            lines.append("")

        # Findings grouped by severity
        if analysis.findings:
            lines.append("#### Findings")
            lines.append("")

            # Group findings by severity
            findings_by_severity = {"high": [], "medium": [], "low": []}
            for finding in analysis.findings:
                if finding.severity in findings_by_severity:
                    findings_by_severity[finding.severity].append(finding)

            severity_labels = {
                "high": "🔴 High Severity",
                "medium": "🟠 Medium Severity",
                "low": "🔵 Low Severity",
            }

            for severity in ["high", "medium", "low"]:
                severity_findings = findings_by_severity[severity]
                if severity_findings:
                    lines.append(f"**{severity_labels[severity]}**")
                    lines.append("")
                    for finding in severity_findings:
                        lines.append(f"- **{finding.description}**")
                        lines.append(
                            f"  - 💡 *Recommendation:* {finding.recommendation}"
                        )
                        if finding.reference:
                            lines.append(f"  - 📚 *Reference:* {finding.reference}")
                    lines.append("")
        else:
            lines.append("✅ No issues found in this section.")
            lines.append("")

        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def save_analysis_output(output: AgentOutput) -> Path:
    """Save analysis output as a formatted markdown file.

    Args:
        output: The analysis output to save

    Returns:
        Path to the saved markdown file
    """
    OUTPUT_DIR.mkdir(exist_ok=True)
    filepath = OUTPUT_DIR / f"analysis_{output.genie_space_id}.md"
    markdown_content = format_analysis_as_markdown(output)
    filepath.write_text(markdown_content)
    return filepath


# Lazy initialization of the analyzer
_analyzer: GenieSpaceAnalyzer | None = None


def get_analyzer() -> GenieSpaceAnalyzer:
    """Get or create the analyzer instance."""
    global _analyzer
    if _analyzer is None:
        _analyzer = GenieSpaceAnalyzer()
    return _analyzer


@invoke_decorator()
async def invoke(data: dict) -> dict:
    """Invoke function for the non-conversational agent."""
    analyzer = get_analyzer()
    input_obj = AgentInput(**data)
    result = analyzer.predict([input_obj])[0]
    save_analysis_output(result)
    return result.model_dump()

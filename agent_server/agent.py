import json
import os
from pathlib import Path

import mlflow
from mlflow.entities import SpanType
from mlflow.genai.agent_server import invoke as invoke_decorator
from openai import OpenAI

from agent_server.ingest import get_serialized_space
from agent_server.models import AgentInput, AgentOutput, Finding, SectionAnalysis

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
        self.llm_client = OpenAI(
            base_url=f"{os.environ['DATABRICKS_HOST']}/serving-endpoints",
            api_key=os.environ["DATABRICKS_TOKEN"],
        )
        self.model = os.environ.get("LLM_MODEL", "databricks-claude-sonnet-4")
        self.best_practices = self._load_best_practices()
        self.schema_docs = self._load_schema_docs()

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
        relevant_practices = self._get_relevant_best_practices(section_name)

        prompt = f"""You are analyzing a Databricks Genie Space configuration section against best practices.

## Section: {section_name}

## Relevant Best Practices:
{relevant_practices}

## Data to Analyze:
```json
{json.dumps(section_data, indent=2)}
```

## Instructions:
Analyze this section against the best practices. For each finding:
- Identify issues or improvement opportunities
- Classify severity as "high", "medium", or "low"
- Provide a specific, actionable recommendation
- Reference the relevant best practice

Output your analysis as JSON with this exact structure:
{{
  "findings": [
    {{
      "category": "best_practice" | "warning" | "suggestion",
      "severity": "high" | "medium" | "low",
      "description": "Description of the issue or opportunity",
      "recommendation": "Specific actionable recommendation",
      "reference": "Reference to the relevant best practice"
    }}
  ],
  "score": 0-100,
  "summary": "Brief summary of the section's compliance"
}}

If the section follows best practices well, return fewer findings with a higher score.
If data is empty or missing, note that as a finding."""

        response = self.llm_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse response, handling potential markdown code blocks
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            # Remove markdown code fences
            lines = content.split("\n")
            content = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])
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


OUTPUT_DIR = Path(__file__).parent.parent / "output"


def save_analysis_output(output: AgentOutput) -> Path:
    """Save analysis output to JSON file.

    Args:
        output: The analysis output to save

    Returns:
        Path to the saved JSON file
    """
    OUTPUT_DIR.mkdir(exist_ok=True)
    filepath = OUTPUT_DIR / f"analysis_{output.genie_space_id}.json"
    filepath.write_text(json.dumps(output.model_dump(), indent=2))
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

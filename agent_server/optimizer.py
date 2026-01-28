"""Optimizer module for generating Genie Space optimization suggestions."""

import json
import logging
import os
from pathlib import Path

import mlflow
from mlflow.entities import SpanType

from agent_server.auth import get_workspace_client
from agent_server.models import (
    ConfigMergeResponse,
    LabelingFeedbackItem,
    OptimizationResponse,
    OptimizationSuggestion,
)
from agent_server.prompts import get_optimization_prompt

logger = logging.getLogger(__name__)


class GenieSpaceOptimizer:
    """Generates optimization suggestions for Genie Space configurations."""

    def __init__(self):
        self.model = os.environ.get("LLM_MODEL", "databricks-claude-sonnet-4")
        self._checklist_content: str | None = None

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

        logger.info(f"Calling serving endpoint: {self.model}")

        response = client.api_client.do(
            method="POST",
            path=f"/serving-endpoints/{self.model}/invocations",
            body={
                "messages": messages,
                "max_tokens": 8192,  # Ensure enough tokens for response
            },
        )

        logger.info(f"Response keys: {response.keys() if isinstance(response, dict) else type(response)}")

        # Response is in OpenAI-compatible format
        if not isinstance(response, dict):
            raise ValueError(f"Unexpected response type: {type(response)}")

        if "choices" not in response:
            logger.error(f"Response missing 'choices': {response}")
            raise ValueError(f"Response missing 'choices' key: {list(response.keys())}")

        if not response["choices"]:
            raise ValueError("Response has empty 'choices' list")

        content = response["choices"][0]["message"]["content"]
        if not content:
            raise ValueError("LLM returned empty content")

        return content

    def _get_checklist_content(self) -> str:
        """Load the checklist markdown content."""
        if self._checklist_content is None:
            checklist_path = Path(__file__).parent.parent / "docs" / "checklist-by-schema.md"
            self._checklist_content = checklist_path.read_text()
        return self._checklist_content

    @mlflow.trace(span_type=SpanType.LLM)
    def generate_optimizations(
        self,
        space_data: dict,
        labeling_feedback: list[LabelingFeedbackItem],
    ) -> OptimizationResponse:
        """Generate optimization suggestions based on labeling feedback.

        Args:
            space_data: The full Genie Space configuration
            labeling_feedback: List of labeling feedback items from the benchmark session

        Returns:
            OptimizationResponse with suggestions and summary
        """
        # Convert feedback items to dicts for the prompt
        feedback_dicts = [
            {
                "question_text": item.question_text,
                "is_correct": item.is_correct,
                "feedback_text": item.feedback_text,
            }
            for item in labeling_feedback
        ]

        # Get checklist content
        checklist_content = self._get_checklist_content()

        # Build the prompt
        prompt = get_optimization_prompt(
            space_data=space_data,
            labeling_feedback=feedback_dicts,
            checklist_content=checklist_content,
        )

        # Call the LLM
        content = self._call_serving_endpoint(
            messages=[{"role": "user", "content": prompt}]
        )

        logger.info(f"Raw LLM response length: {len(content)}")

        # Parse response, handling potential markdown code blocks
        content = content.strip()
        if content.startswith("```"):
            # Find the end of the code block
            lines = content.split("\n")
            # Skip first line (```json or ```)
            start_idx = 1
            # Find closing ```
            end_idx = len(lines)
            for i in range(len(lines) - 1, 0, -1):
                if lines[i].strip() == "```":
                    end_idx = i
                    break
            content = "\n".join(lines[start_idx:end_idx])

        # Handle case where response might have text before JSON
        if not content.startswith("{"):
            # Try to find JSON object in the response
            json_start = content.find("{")
            if json_start != -1:
                # Find matching closing brace
                brace_count = 0
                json_end = -1
                for i, char in enumerate(content[json_start:], json_start):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            json_end = i + 1
                            break
                if json_end != -1:
                    content = content[json_start:json_end]

        logger.info(f"Parsed content length: {len(content)}")
        if not content:
            raise ValueError("LLM returned empty response after parsing")

        try:
            result = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            logger.error(f"Content preview: {content[:500]}...")
            raise

        # Convert to response model
        suggestions = [
            OptimizationSuggestion(**s) for s in result.get("suggestions", [])
        ]
        summary = result.get("summary", "")

        # Get trace ID if available
        trace_id = ""
        if mlflow.get_current_active_span() is not None:
            try:
                trace_id = mlflow.get_current_active_span().request_id or ""
            except Exception:
                pass

        return OptimizationResponse(
            suggestions=suggestions,
            summary=summary,
            trace_id=trace_id,
        )

    def merge_config(
        self,
        space_data: dict,
        suggestions: list[OptimizationSuggestion],
    ) -> ConfigMergeResponse:
        """Merge optimization suggestions into the config programmatically.

        Args:
            space_data: The original Genie Space configuration
            suggestions: List of optimization suggestions to apply

        Returns:
            ConfigMergeResponse with merged config and summary
        """
        import copy
        import re

        # Deep copy to avoid modifying original
        merged = copy.deepcopy(space_data)

        applied_count = 0
        failed_paths = []

        for suggestion in suggestions:
            try:
                self._apply_suggestion(merged, suggestion.field_path, suggestion.suggested_value)
                applied_count += 1
            except Exception as e:
                logger.warning(f"Failed to apply suggestion at {suggestion.field_path}: {e}")
                failed_paths.append(suggestion.field_path)

        # Build summary
        if failed_paths:
            summary = f"Applied {applied_count} of {len(suggestions)} suggestions. Failed paths: {', '.join(failed_paths[:3])}{'...' if len(failed_paths) > 3 else ''}"
        else:
            summary = f"Successfully applied all {applied_count} suggestions to the configuration."

        return ConfigMergeResponse(
            merged_config=merged,
            summary=summary,
            trace_id="",
        )

    def _apply_suggestion(self, config: dict, field_path: str, value: any) -> None:
        """Apply a single suggestion to the config at the given path.

        Supports paths like:
        - "instructions.text_instructions[0].content"
        - "data_sources.tables[2].columns[0].synonyms"
        """
        import re

        # Parse path into segments
        # Split on dots, but handle array indices
        segments = []
        for part in field_path.split("."):
            # Check for array index like "text_instructions[0]"
            match = re.match(r"^(.+?)\[(\d+)\]$", part)
            if match:
                segments.append(match.group(1))  # key name
                segments.append(int(match.group(2)))  # array index
            else:
                segments.append(part)

        # Navigate to parent and set value
        current = config
        for i, segment in enumerate(segments[:-1]):
            if isinstance(segment, int):
                # Array index
                if not isinstance(current, list) or segment >= len(current):
                    raise ValueError(f"Invalid array index {segment} at path position {i}")
                current = current[segment]
            else:
                # Object key
                if not isinstance(current, dict):
                    raise ValueError(f"Expected dict at {segment}, got {type(current)}")
                if segment not in current:
                    # Create missing intermediate objects
                    next_segment = segments[i + 1] if i + 1 < len(segments) else None
                    current[segment] = [] if isinstance(next_segment, int) else {}
                current = current[segment]

        # Set the final value
        final_key = segments[-1]
        if isinstance(final_key, int):
            if not isinstance(current, list):
                raise ValueError(f"Expected list for index {final_key}")
            # Extend list if needed
            while len(current) <= final_key:
                current.append(None)
            current[final_key] = value
        else:
            if not isinstance(current, dict):
                raise ValueError(f"Expected dict for key {final_key}")
            current[final_key] = value


# Lazy initialization
_optimizer: GenieSpaceOptimizer | None = None


def get_optimizer() -> GenieSpaceOptimizer:
    """Get or create the optimizer instance."""
    global _optimizer
    if _optimizer is None:
        _optimizer = GenieSpaceOptimizer()
    return _optimizer

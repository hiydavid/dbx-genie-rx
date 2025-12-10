"""Prompts for the Genie Space Analyzer agent."""

import json


def get_section_analysis_prompt(
    section_name: str,
    relevant_practices: str,
    section_data: dict | list,
) -> str:
    """Build the prompt for analyzing a Genie Space section against best practices.

    Args:
        section_name: Name of the section being analyzed (e.g. "config.sample_questions")
        relevant_practices: Best practices documentation relevant to this section
        section_data: The actual data from the Genie Space section to analyze

    Returns:
        The formatted prompt string
    """
    return f"""You are analyzing a Databricks Genie Space configuration section against best practices.

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
- No need to check for SQL syntax error since that is done on the Genie Space UI

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
  "score": 0-10,
  "summary": "Brief summary of the section's compliance"
}}

If the section follows best practices well, return fewer findings with a higher score (closer to 10).
If data is empty or missing, note that as a finding."""


def get_checklist_evaluation_prompt(
    section_name: str,
    section_data: dict | list | None,
    checklist_items: list[dict],
) -> str:
    """Build the prompt for LLM to evaluate qualitative checklist items.

    Args:
        section_name: Name of the section being analyzed
        section_data: The actual data from the Genie Space section to analyze
        checklist_items: List of dicts with 'id' and 'description' for each item to evaluate

    Returns:
        The formatted prompt string
    """
    items_text = "\n".join(
        f"- {item['id']}: {item['description']}"
        for item in checklist_items
    )

    data_json = json.dumps(section_data, indent=2) if section_data else "null (section not configured)"

    return f"""You are evaluating a Databricks Genie Space configuration section against specific checklist criteria.

## Section: {section_name}

## Data to Analyze:
```json
{data_json}
```

## Checklist Items to Evaluate:
{items_text}

## Instructions:
For each checklist item, determine if the configuration passes or fails the criterion.
Be fair but thorough - a check should pass if the configuration reasonably meets the criterion.
If the section data is empty/null, most quality checks should fail (except those that are N/A).

Output your evaluation as JSON with this exact structure:
{{
  "evaluations": [
    {{
      "id": "item_id_here",
      "passed": true | false,
      "details": "Brief explanation of why it passed or failed"
    }}
  ],
  "findings": [
    {{
      "category": "best_practice" | "warning" | "suggestion",
      "severity": "high" | "medium" | "low",
      "description": "Description of the issue (only for failed items)",
      "recommendation": "Specific actionable recommendation",
      "reference": "Related checklist item ID"
    }}
  ],
  "summary": "Brief overall summary of the section's compliance"
}}

Only include findings for checklist items that FAILED. Do not create findings for passing items.
Match finding severity to the importance of the failed check:
- high: Critical functionality or major best practice violation
- medium: Recommended practice not followed
- low: Minor improvement opportunity"""

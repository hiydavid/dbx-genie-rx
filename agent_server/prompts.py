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

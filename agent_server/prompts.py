"""Prompts for the Genie Space Analyzer agent."""

import json


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


def get_optimization_prompt(
    space_data: dict,
    labeling_feedback: list[dict],
    checklist_content: str,
) -> str:
    """Build the prompt for generating optimization suggestions based on labeling feedback.

    Args:
        space_data: The full Genie Space configuration
        labeling_feedback: List of dicts with question_text, is_correct, feedback_text
        checklist_content: The best practices checklist markdown

    Returns:
        The formatted prompt string
    """
    # Separate correct and incorrect questions
    incorrect_questions = [f for f in labeling_feedback if f.get("is_correct") is False]
    correct_questions = [f for f in labeling_feedback if f.get("is_correct") is True]

    # Format feedback for the prompt
    feedback_lines = []
    for i, item in enumerate(labeling_feedback, 1):
        status = "CORRECT" if item.get("is_correct") else "INCORRECT" if item.get("is_correct") is False else "NOT LABELED"
        line = f"{i}. [{status}] {item.get('question_text', '')}"
        if item.get("feedback_text"):
            line += f"\n   Feedback: {item['feedback_text']}"
        feedback_lines.append(line)

    feedback_text = "\n".join(feedback_lines)

    return f"""You are an expert at optimizing Databricks Genie Space configurations to improve answer accuracy.

## Task
Analyze the Genie Space configuration and labeling feedback to generate specific, field-level optimization suggestions that will help Genie answer questions more accurately.

## Genie Space Configuration
```json
{json.dumps(space_data, indent=2)}
```

## Labeling Feedback
The user labeled {len(labeling_feedback)} benchmark questions:
- {len(correct_questions)} answered correctly by Genie
- {len(incorrect_questions)} answered incorrectly by Genie

{feedback_text}

## Best Practices Checklist
{checklist_content}

## Instructions

Generate optimization suggestions that will improve Genie's accuracy, especially for the INCORRECT questions.

**Constraints:**
1. Only suggest modifications to EXISTING fields - do not suggest adding new tables
2. Use exact JSON paths for field_path (e.g., "instructions.text_instructions[0].content", "instructions.sql_snippets.filters[2].snippet")
3. Prioritize suggestions that directly address incorrect benchmark questions
4. Limit to 10-15 most impactful suggestions

**Valid categories:**
- instruction: Text instruction modifications
- sql_example: Example question-SQL pair modifications
- filter: SQL snippet filter modifications
- expression: SQL snippet expression modifications
- measure: SQL snippet measure modifications
- synonym: Column synonym additions
- join_spec: Join specification modifications
- description: Column/table description modifications

**Priority levels:**
- high: Directly addresses an incorrect benchmark question
- medium: Improves general accuracy based on patterns
- low: Minor enhancement for clarity

Output your suggestions as JSON with this exact structure:
{{
  "suggestions": [
    {{
      "field_path": "exact.json.path[index].field",
      "current_value": <current value from config or null if adding>,
      "suggested_value": <new suggested value>,
      "rationale": "Explanation of why this change helps and which questions it addresses",
      "checklist_reference": "related-checklist-item-id or null",
      "priority": "high" | "medium" | "low",
      "category": "instruction" | "sql_example" | "filter" | "expression" | "measure" | "synonym" | "join_spec" | "description"
    }}
  ],
  "summary": "Brief overall summary of the optimization strategy"
}}

Focus on actionable changes that will measurably improve Genie's ability to answer the types of questions that were marked incorrect."""

"""Heuristic-based configuration style detection for Genie Spaces.

Detects the configuration style without LLM calls by analyzing
the presence and counts of various configuration elements.
"""

from agent_server.models import ConfigStyle, StyleDetectionResult


def _get_nested(data: dict, path: str) -> list | dict | None:
    """Get a nested value from a dict using dot notation."""
    parts = path.split(".")
    current = data
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


def _count_items(data: dict, path: str) -> int:
    """Count items at a given path (assumes it's a list)."""
    value = _get_nested(data, path)
    if isinstance(value, list):
        return len(value)
    return 0


def _has_rich_content(data: dict, path: str, min_chars: int = 100) -> bool:
    """Check if a path has content exceeding min_chars total."""
    value = _get_nested(data, path)
    if isinstance(value, list):
        total_chars = sum(
            len(str(item.get("content", "") if isinstance(item, dict) else item))
            for item in value
        )
        return total_chars >= min_chars
    return False


def detect_style(space_data: dict) -> StyleDetectionResult:
    """Detect the configuration style of a Genie Space.

    Uses heuristics based on counts and presence of various elements
    to determine the primary configuration approach.

    Args:
        space_data: The serialized Genie Space data

    Returns:
        StyleDetectionResult with detected style, confidence, and indicators
    """
    # Gather indicators
    indicators = {
        "tables_count": _count_items(space_data, "data_sources.tables"),
        "metric_views_count": _count_items(space_data, "data_sources.metric_views"),
        "text_instructions_count": _count_items(space_data, "instructions.text_instructions"),
        "example_sqls_count": _count_items(space_data, "instructions.example_question_sqls"),
        "sql_functions_count": _count_items(space_data, "instructions.sql_functions"),
        "join_specs_count": _count_items(space_data, "instructions.join_specs"),
        "filters_count": _count_items(space_data, "instructions.sql_snippets.filters"),
        "expressions_count": _count_items(space_data, "instructions.sql_snippets.expressions"),
        "measures_count": _count_items(space_data, "instructions.sql_snippets.measures"),
        "benchmarks_count": _count_items(space_data, "benchmarks.questions"),
        "has_rich_instructions": _has_rich_content(space_data, "instructions.text_instructions", 200),
    }

    # Calculate total snippets
    indicators["total_snippets"] = (
        indicators["filters_count"] +
        indicators["expressions_count"] +
        indicators["measures_count"]
    )

    # Score each style pattern
    scores: dict[ConfigStyle, float] = {}

    # Calculate total configuration items for minimal detection
    total_items = sum([
        indicators["tables_count"],
        indicators["metric_views_count"],
        indicators["text_instructions_count"],
        indicators["example_sqls_count"],
        indicators["total_snippets"],
    ])

    # Metric Views Focused: >= 3 metric views as primary approach
    mv_score = 0.0
    if indicators["metric_views_count"] >= 3:
        mv_score += 0.6  # Strong signal
    if indicators["metric_views_count"] >= 5:
        mv_score += 0.2
    if indicators["metric_views_count"] > indicators["tables_count"]:
        mv_score += 0.2
    scores[ConfigStyle.METRIC_VIEWS_FOCUSED] = mv_score

    # Tables with Knowledge Base: >= 3 tables, rich instructions/snippets
    tkb_score = 0.0
    if indicators["tables_count"] >= 3:
        tkb_score += 0.3
    if indicators["tables_count"] >= 5:
        tkb_score += 0.2
    if indicators["has_rich_instructions"]:
        tkb_score += 0.25
    if indicators["total_snippets"] >= 3:
        tkb_score += 0.15
    if indicators["join_specs_count"] >= 1:
        tkb_score += 0.1
    scores[ConfigStyle.TABLES_WITH_KNOWLEDGE_BASE] = tkb_score

    # Example Driven: >= 5 example SQL queries
    ed_score = 0.0
    if indicators["example_sqls_count"] >= 3:
        ed_score += 0.3
    if indicators["example_sqls_count"] >= 5:
        ed_score += 0.4
    if indicators["example_sqls_count"] >= 10:
        ed_score += 0.3
    scores[ConfigStyle.EXAMPLE_DRIVEN] = ed_score

    # Minimal Viable: basic setup with minimal configuration
    # Only triggers when there's actually minimal config AND no strong patterns
    mv_viable_score = 0.0
    has_strong_pattern = (
        indicators["metric_views_count"] >= 3 or
        indicators["tables_count"] >= 3 or
        indicators["example_sqls_count"] >= 3 or
        indicators["has_rich_instructions"]
    )
    if not has_strong_pattern:
        if total_items <= 3:
            mv_viable_score += 0.7
        elif total_items <= 5:
            mv_viable_score += 0.5
        elif total_items <= 8:
            mv_viable_score += 0.3
    scores[ConfigStyle.MINIMAL_VIABLE] = mv_viable_score

    # Hybrid: mixed approach with multiple strong areas
    hybrid_score = 0.0
    strong_areas = 0
    if indicators["metric_views_count"] >= 2:
        strong_areas += 1
    if indicators["tables_count"] >= 2:
        strong_areas += 1
    if indicators["example_sqls_count"] >= 2:
        strong_areas += 1
    if indicators["total_snippets"] >= 2:
        strong_areas += 1
    if indicators["has_rich_instructions"]:
        strong_areas += 1

    if strong_areas >= 3:
        hybrid_score += 0.5
    if strong_areas >= 4:
        hybrid_score += 0.3
    if strong_areas == 5:
        hybrid_score += 0.2
    scores[ConfigStyle.HYBRID] = hybrid_score

    # Find the best matching style
    best_style = max(scores, key=lambda s: scores[s])
    best_score = scores[best_style]

    # Calculate confidence based on score and margin over second best
    sorted_scores = sorted(scores.values(), reverse=True)
    margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else sorted_scores[0]
    confidence = min(1.0, best_score * 0.7 + margin * 0.3)

    # If no clear winner, default to hybrid with lower confidence
    if best_score < 0.3:
        best_style = ConfigStyle.HYBRID
        confidence = 0.3

    # Generate description
    descriptions = {
        ConfigStyle.METRIC_VIEWS_FOCUSED: (
            "This space is optimized around metric views, providing pre-computed "
            "aggregations that guide Genie toward accurate analytical queries."
        ),
        ConfigStyle.TABLES_WITH_KNOWLEDGE_BASE: (
            "This space uses a rich knowledge base of instructions, snippets, and "
            "join specifications to help Genie navigate complex table relationships."
        ),
        ConfigStyle.EXAMPLE_DRIVEN: (
            "This space teaches Genie through extensive example SQL queries, "
            "showing the expected patterns for various question types."
        ),
        ConfigStyle.MINIMAL_VIABLE: (
            "This space has a basic configuration that could benefit from "
            "additional context to improve Genie's accuracy."
        ),
        ConfigStyle.HYBRID: (
            "This space uses a balanced approach, combining multiple "
            "configuration strategies to guide Genie."
        ),
    }

    return StyleDetectionResult(
        detected_style=best_style,
        confidence=round(confidence, 2),
        indicators=indicators,
        description=descriptions[best_style],
    )

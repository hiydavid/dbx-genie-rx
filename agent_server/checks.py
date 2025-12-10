"""Programmatic checks for Genie Space configuration validation.

Each check function returns a ChecklistItem with the result.
"""

from agent_server.models import ChecklistItem


# =============================================================================
# config.sample_questions checks
# =============================================================================


def check_sample_questions_exist(section_data: list | None) -> ChecklistItem:
    """Check: At least 1 sample question exists."""
    if section_data is None:
        return ChecklistItem(
            id="sample_questions_exist",
            description="At least 1 sample question exists",
            check_type="programmatic",
            passed=False,
            details="Section not configured",
        )

    count = len(section_data) if isinstance(section_data, list) else 0
    return ChecklistItem(
        id="sample_questions_exist",
        description="At least 1 sample question exists",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} sample question(s)",
    )


# =============================================================================
# data_sources.tables checks
# =============================================================================


def check_tables_exist(section_data: list | None) -> ChecklistItem:
    """Check: At least 1 table is configured."""
    if section_data is None:
        return ChecklistItem(
            id="tables_exist",
            description="At least 1 table is configured",
            check_type="programmatic",
            passed=False,
            details="Section not configured",
        )

    count = len(section_data) if isinstance(section_data, list) else 0
    return ChecklistItem(
        id="tables_exist",
        description="At least 1 table is configured",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} table(s)",
    )


def check_tables_count_limit(section_data: list | None) -> ChecklistItem:
    """Check: Number of tables is 25 or fewer."""
    if section_data is None:
        return ChecklistItem(
            id="tables_count_limit",
            description="Number of tables is 25 or fewer",
            check_type="programmatic",
            passed=False,  # Fail if no tables configured
            details="Section not configured",
        )

    count = len(section_data) if isinstance(section_data, list) else 0
    return ChecklistItem(
        id="tables_count_limit",
        description="Number of tables is 25 or fewer",
        check_type="programmatic",
        passed=count <= 25,
        details=f"Found {count} table(s)" + (" (exceeds limit)" if count > 25 else ""),
    )


def check_column_descriptions_exist(section_data: list | None) -> ChecklistItem:
    """Check: Columns have descriptions defined."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="column_descriptions_exist",
            description="Columns have descriptions defined",
            check_type="programmatic",
            passed=False,
            details="No tables configured",
        )

    total_columns = 0
    columns_with_descriptions = 0

    for table in section_data:
        column_configs = table.get("column_configs", [])
        for col in column_configs:
            total_columns += 1
            desc = col.get("description", [])
            if desc and any(d.strip() for d in desc if isinstance(d, str)):
                columns_with_descriptions += 1

    if total_columns == 0:
        return ChecklistItem(
            id="column_descriptions_exist",
            description="Columns have descriptions defined",
            check_type="programmatic",
            passed=False,  # Fail if no columns configured
            details="No column configs found",
        )

    passed = columns_with_descriptions >= total_columns * 0.5  # At least 50%
    return ChecklistItem(
        id="column_descriptions_exist",
        description="Columns have descriptions defined",
        check_type="programmatic",
        passed=passed,
        details=f"{columns_with_descriptions}/{total_columns} columns have descriptions",
    )


def check_column_synonyms_exist(section_data: list | None) -> ChecklistItem:
    """Check: Key columns have synonyms defined."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="column_synonyms_exist",
            description="Key columns have synonyms defined",
            check_type="programmatic",
            passed=False,
            details="No tables configured",
        )

    total_columns = 0
    columns_with_synonyms = 0

    for table in section_data:
        column_configs = table.get("column_configs", [])
        for col in column_configs:
            total_columns += 1
            synonyms = col.get("synonyms", [])
            if synonyms and len(synonyms) > 0:
                columns_with_synonyms += 1

    if total_columns == 0:
        return ChecklistItem(
            id="column_synonyms_exist",
            description="Key columns have synonyms defined",
            check_type="programmatic",
            passed=False,  # Fail if no columns configured
            details="No column configs found",
        )

    # At least some columns should have synonyms (20% threshold)
    passed = columns_with_synonyms >= max(1, total_columns * 0.2)
    return ChecklistItem(
        id="column_synonyms_exist",
        description="Key columns have synonyms defined",
        check_type="programmatic",
        passed=passed,
        details=f"{columns_with_synonyms}/{total_columns} columns have synonyms",
    )


def check_example_values_enabled(section_data: list | None) -> ChecklistItem:
    """Check: Filterable columns have get_example_values enabled."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="example_values_enabled",
            description="Filterable columns have get_example_values enabled",
            check_type="programmatic",
            passed=False,
            details="No tables configured",
        )

    total_columns = 0
    columns_with_example_values = 0

    for table in section_data:
        column_configs = table.get("column_configs", [])
        for col in column_configs:
            total_columns += 1
            if col.get("get_example_values", False):
                columns_with_example_values += 1

    if total_columns == 0:
        return ChecklistItem(
            id="example_values_enabled",
            description="Filterable columns have get_example_values enabled",
            check_type="programmatic",
            passed=False,  # Fail if no columns configured
            details="No column configs found",
        )

    # At least some columns should have example values enabled (20% threshold)
    passed = columns_with_example_values >= max(1, total_columns * 0.2)
    return ChecklistItem(
        id="example_values_enabled",
        description="Filterable columns have get_example_values enabled",
        check_type="programmatic",
        passed=passed,
        details=f"{columns_with_example_values}/{total_columns} columns have example values enabled",
    )


def check_value_dictionary_enabled(section_data: list | None) -> ChecklistItem:
    """Check: Columns with discrete values have build_value_dictionary enabled."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="value_dictionary_enabled",
            description="Columns with discrete values have build_value_dictionary enabled",
            check_type="programmatic",
            passed=False,
            details="No tables configured",
        )

    total_columns = 0
    columns_with_value_dict = 0

    for table in section_data:
        column_configs = table.get("column_configs", [])
        for col in column_configs:
            total_columns += 1
            if col.get("build_value_dictionary", False):
                columns_with_value_dict += 1

    if total_columns == 0:
        return ChecklistItem(
            id="value_dictionary_enabled",
            description="Columns with discrete values have build_value_dictionary enabled",
            check_type="programmatic",
            passed=False,  # Fail if no columns configured
            details="No column configs found",
        )

    # Having any columns with value dictionary is good
    passed = columns_with_value_dict >= 1
    return ChecklistItem(
        id="value_dictionary_enabled",
        description="Columns with discrete values have build_value_dictionary enabled",
        check_type="programmatic",
        passed=passed,
        details=f"{columns_with_value_dict}/{total_columns} columns have value dictionary enabled",
    )


def check_columns_excluded(section_data: list | None) -> ChecklistItem:
    """Check: Technical/internal columns are excluded."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="columns_excluded",
            description="Technical/internal columns are excluded",
            check_type="programmatic",
            passed=False,
            details="No tables configured",
        )

    total_columns = 0
    excluded_columns = 0

    for table in section_data:
        column_configs = table.get("column_configs", [])
        for col in column_configs:
            total_columns += 1
            if col.get("exclude", False):
                excluded_columns += 1

    if total_columns == 0:
        return ChecklistItem(
            id="columns_excluded",
            description="Technical/internal columns are excluded",
            check_type="programmatic",
            passed=False,  # Fail if no columns configured
            details="No column configs found",
        )

    # Having some excluded columns indicates thoughtful curation
    # Pass if at least one column is excluded (shows user is curating)
    passed = excluded_columns >= 1 or total_columns <= 5  # Small tables may not need exclusions
    return ChecklistItem(
        id="columns_excluded",
        description="Technical/internal columns are excluded",
        check_type="programmatic",
        passed=passed,
        details=f"{excluded_columns}/{total_columns} columns excluded",
    )


# =============================================================================
# data_sources.metric_views checks
# =============================================================================


def check_metric_views_have_descriptions(section_data: list | None) -> ChecklistItem:
    """Check: Metric views have descriptions (if any exist)."""
    if section_data is None or not isinstance(section_data, list) or len(section_data) == 0:
        return ChecklistItem(
            id="metric_views_descriptions",
            description="Metric views have descriptions (if any exist)",
            check_type="programmatic",
            passed=False,  # Fail if no metric views configured
            details="No metric views configured",
        )

    total = len(section_data)
    with_descriptions = sum(
        1 for mv in section_data
        if mv.get("description") and any(d.strip() for d in mv.get("description", []) if isinstance(d, str))
    )

    passed = with_descriptions >= total * 0.5  # At least 50%
    return ChecklistItem(
        id="metric_views_descriptions",
        description="Metric views have descriptions (if any exist)",
        check_type="programmatic",
        passed=passed,
        details=f"{with_descriptions}/{total} metric views have descriptions",
    )


# =============================================================================
# instructions.text_instructions checks
# =============================================================================


def check_text_instructions_exist(section_data: list | None) -> ChecklistItem:
    """Check: At least 1 text instruction exists."""
    if section_data is None:
        return ChecklistItem(
            id="text_instructions_exist",
            description="At least 1 text instruction exists",
            check_type="programmatic",
            passed=False,
            details="Section not configured",
        )

    count = len(section_data) if isinstance(section_data, list) else 0
    return ChecklistItem(
        id="text_instructions_exist",
        description="At least 1 text instruction exists",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} text instruction(s)",
    )


# =============================================================================
# instructions.example_question_sqls checks
# =============================================================================


def check_example_sqls_exist(section_data: list | None) -> ChecklistItem:
    """Check: At least 1 example question-SQL pair exists."""
    if section_data is None:
        return ChecklistItem(
            id="example_sqls_exist",
            description="At least 1 example question-SQL pair exists",
            check_type="programmatic",
            passed=False,
            details="Section not configured",
        )

    count = len(section_data) if isinstance(section_data, list) else 0
    return ChecklistItem(
        id="example_sqls_exist",
        description="At least 1 example question-SQL pair exists",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} example question-SQL pair(s)",
    )


def check_parameters_have_descriptions(section_data: list | None) -> ChecklistItem:
    """Check: Parameters have descriptions defined (if parameters exist)."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="parameters_descriptions",
            description="Parameters have descriptions defined (if parameters exist)",
            check_type="programmatic",
            passed=False,  # Fail if section not configured
            details="Section not configured",
        )

    total_params = 0
    params_with_descriptions = 0

    for example in section_data:
        params = example.get("parameters", [])
        for param in params:
            total_params += 1
            desc = param.get("description", [])
            if desc and any(d.strip() for d in desc if isinstance(d, str)):
                params_with_descriptions += 1

    if total_params == 0:
        return ChecklistItem(
            id="parameters_descriptions",
            description="Parameters have descriptions defined (if parameters exist)",
            check_type="programmatic",
            passed=False,  # Fail if no parameters defined
            details="No parameters defined",
        )

    passed = params_with_descriptions >= total_params * 0.5  # At least 50%
    return ChecklistItem(
        id="parameters_descriptions",
        description="Parameters have descriptions defined (if parameters exist)",
        check_type="programmatic",
        passed=passed,
        details=f"{params_with_descriptions}/{total_params} parameters have descriptions",
    )


def check_usage_guidance_provided(section_data: list | None) -> ChecklistItem:
    """Check: Usage guidance is provided for complex examples."""
    if section_data is None or not isinstance(section_data, list):
        return ChecklistItem(
            id="usage_guidance_provided",
            description="Usage guidance is provided for complex examples",
            check_type="programmatic",
            passed=False,  # Fail if section not configured
            details="Section not configured",
        )

    total_examples = len(section_data)
    examples_with_guidance = sum(
        1 for ex in section_data
        if ex.get("usage_guidance") and any(g.strip() for g in ex.get("usage_guidance", []) if isinstance(g, str))
    )

    if total_examples == 0:
        return ChecklistItem(
            id="usage_guidance_provided",
            description="Usage guidance is provided for complex examples",
            check_type="programmatic",
            passed=False,  # Fail if no examples defined
            details="No examples defined",
        )

    # At least some examples should have usage guidance (30% threshold)
    passed = examples_with_guidance >= max(1, total_examples * 0.3)
    return ChecklistItem(
        id="usage_guidance_provided",
        description="Usage guidance is provided for complex examples",
        check_type="programmatic",
        passed=passed,
        details=f"{examples_with_guidance}/{total_examples} examples have usage guidance",
    )


# =============================================================================
# instructions.sql_functions checks
# =============================================================================


def check_sql_functions_registered(section_data: list | None) -> ChecklistItem:
    """Check: Registered functions exist in Unity Catalog (if any defined)."""
    if section_data is None or not isinstance(section_data, list) or len(section_data) == 0:
        return ChecklistItem(
            id="sql_functions_registered",
            description="Registered functions exist in Unity Catalog (if any defined)",
            check_type="programmatic",
            passed=False,  # Fail if no SQL functions configured
            details="No SQL functions configured",
        )

    # Check if functions have identifiers
    total = len(section_data)
    with_identifiers = sum(1 for fn in section_data if fn.get("identifier"))

    return ChecklistItem(
        id="sql_functions_registered",
        description="Registered functions exist in Unity Catalog (if any defined)",
        check_type="programmatic",
        passed=with_identifiers == total,
        details=f"{with_identifiers}/{total} functions have Unity Catalog identifiers",
    )


# =============================================================================
# instructions.join_specs checks
# =============================================================================


def check_join_specs_defined(section_data: list | None, tables_data: list | None) -> ChecklistItem:
    """Check: Join specs are defined for multi-table relationships (if >1 table)."""
    join_count = len(section_data) if section_data and isinstance(section_data, list) else 0
    table_count = len(tables_data) if tables_data and isinstance(tables_data, list) else 0

    if join_count == 0:
        return ChecklistItem(
            id="join_specs_defined",
            description="Join specs are defined for multi-table relationships (if >1 table)",
            check_type="programmatic",
            passed=False,  # Fail if no join specs configured
            details=f"No join specs configured ({table_count} table(s))",
        )

    return ChecklistItem(
        id="join_specs_defined",
        description="Join specs are defined for multi-table relationships (if >1 table)",
        check_type="programmatic",
        passed=True,
        details=f"Found {join_count} join spec(s) for {table_count} tables",
    )


# =============================================================================
# instructions.sql_snippets.filters checks
# =============================================================================


def check_filters_exist(section_data: list | None) -> ChecklistItem:
    """Check: Common time period filters exist."""
    if section_data is None or not isinstance(section_data, list) or len(section_data) == 0:
        return ChecklistItem(
            id="filters_exist",
            description="Common time period filters exist",
            check_type="programmatic",
            passed=False,
            details="No filters configured",
        )

    count = len(section_data)
    return ChecklistItem(
        id="filters_exist",
        description="Common time period filters exist",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} filter(s)",
    )


# =============================================================================
# instructions.sql_snippets.expressions checks
# =============================================================================


def check_expressions_exist(section_data: list | None) -> ChecklistItem:
    """Check: Reusable expressions are defined for common categorizations."""
    if section_data is None or not isinstance(section_data, list) or len(section_data) == 0:
        return ChecklistItem(
            id="expressions_exist",
            description="Reusable expressions are defined for common categorizations",
            check_type="programmatic",
            passed=False,
            details="No expressions configured",
        )

    count = len(section_data)
    return ChecklistItem(
        id="expressions_exist",
        description="Reusable expressions are defined for common categorizations",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} expression(s)",
    )


# =============================================================================
# instructions.sql_snippets.measures checks
# =============================================================================


def check_measures_exist(section_data: list | None) -> ChecklistItem:
    """Check: Frequently used metrics are defined."""
    if section_data is None or not isinstance(section_data, list) or len(section_data) == 0:
        return ChecklistItem(
            id="measures_exist",
            description="Frequently used metrics are defined",
            check_type="programmatic",
            passed=False,
            details="No measures configured",
        )

    count = len(section_data)
    return ChecklistItem(
        id="measures_exist",
        description="Frequently used metrics are defined",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} measure(s)",
    )


# =============================================================================
# benchmarks.questions checks
# =============================================================================


def check_benchmark_questions_exist(section_data: list | None) -> ChecklistItem:
    """Check: At least 1 benchmark question exists."""
    if section_data is None:
        return ChecklistItem(
            id="benchmark_questions_exist",
            description="At least 1 benchmark question exists",
            check_type="programmatic",
            passed=False,
            details="Section not configured",
        )

    count = len(section_data) if isinstance(section_data, list) else 0
    return ChecklistItem(
        id="benchmark_questions_exist",
        description="At least 1 benchmark question exists",
        check_type="programmatic",
        passed=count >= 1,
        details=f"Found {count} benchmark question(s)",
    )


# =============================================================================
# Section-to-checks mapping
# =============================================================================


def get_programmatic_checks_for_section(
    section_name: str,
    section_data: dict | list | None,
    full_space: dict | None = None,
) -> list[ChecklistItem]:
    """Get all programmatic check results for a given section.

    Args:
        section_name: Name of the section (e.g., "data_sources.tables")
        section_data: The data for this section
        full_space: The full space data (needed for cross-section checks like join_specs)

    Returns:
        List of ChecklistItem results for all programmatic checks
    """
    checks = []

    if section_name == "config.sample_questions":
        checks.append(check_sample_questions_exist(section_data))

    elif section_name == "data_sources.tables":
        checks.append(check_tables_exist(section_data))
        checks.append(check_tables_count_limit(section_data))
        checks.append(check_column_descriptions_exist(section_data))
        checks.append(check_column_synonyms_exist(section_data))
        checks.append(check_example_values_enabled(section_data))
        checks.append(check_value_dictionary_enabled(section_data))
        checks.append(check_columns_excluded(section_data))

    elif section_name == "data_sources.metric_views":
        checks.append(check_metric_views_have_descriptions(section_data))

    elif section_name == "instructions.text_instructions":
        checks.append(check_text_instructions_exist(section_data))

    elif section_name == "instructions.example_question_sqls":
        checks.append(check_example_sqls_exist(section_data))
        checks.append(check_parameters_have_descriptions(section_data))
        checks.append(check_usage_guidance_provided(section_data))

    elif section_name == "instructions.sql_functions":
        checks.append(check_sql_functions_registered(section_data))

    elif section_name == "instructions.join_specs":
        tables_data = None
        if full_space:
            tables_data = full_space.get("data_sources", {}).get("tables")
        checks.append(check_join_specs_defined(section_data, tables_data))

    elif section_name == "instructions.sql_snippets.filters":
        checks.append(check_filters_exist(section_data))

    elif section_name == "instructions.sql_snippets.expressions":
        checks.append(check_expressions_exist(section_data))

    elif section_name == "instructions.sql_snippets.measures":
        checks.append(check_measures_exist(section_data))

    elif section_name == "benchmarks.questions":
        checks.append(check_benchmark_questions_exist(section_data))

    return checks


# =============================================================================
# LLM checklist items definition
# =============================================================================


# Define all LLM-evaluated checklist items per section
LLM_CHECKLIST_ITEMS = {
    "config.sample_questions": [
        {"id": "questions_demonstrate_capabilities", "description": "Questions demonstrate the space's core capabilities"},
        {"id": "questions_reflect_user_needs", "description": "Questions reflect real business user needs"},
        {"id": "questions_focused_on_purpose", "description": "Questions are focused on the space's defined purpose"},
    ],
    "data_sources.tables": [
        {"id": "tables_focused", "description": "Tables are focused (only necessary tables for intended questions)"},
        {"id": "tables_well_annotated", "description": "Tables are well-annotated with descriptions"},
        {"id": "datasets_simplified", "description": "Datasets are simplified (prejoined where appropriate, unnecessary columns removed)"},
        {"id": "descriptions_contextual", "description": "Column descriptions provide clear, precise contextual information"},
        {"id": "descriptions_not_redundant", "description": "Column descriptions avoid duplicating information from column names"},
        {"id": "synonyms_match_user_terms", "description": "Column synonyms match how business users naturally refer to the data"},
        {"id": "synonyms_include_abbreviations", "description": "Column synonyms include common abbreviations and alternative phrasings"},
        {"id": "columns_irrelevant_hidden", "description": "Columns not relevant to the space's purpose are hidden"},
    ],
    "data_sources.metric_views": [
        {"id": "metrics_explain_aggregations", "description": "Pre-computed metrics have comments explaining valid aggregations"},
    ],
    "instructions.text_instructions": [
        {"id": "instructions_focused_minimal", "description": "Instructions are focused and minimal (not excessive)"},
        {"id": "instructions_global_context", "description": "Instructions provide globally-applied context"},
        {"id": "jargon_mapped", "description": "Business jargon is mapped to standard terminology where needed"},
        {"id": "timezone_handling", "description": "Time zone handling is specified if applicable"},
    ],
    "instructions.example_question_sqls": [
        {"id": "examples_cover_complex", "description": "Examples cover complex, multi-part, or hard-to-interpret questions"},
        {"id": "sql_demonstrates_patterns", "description": "SQL queries demonstrate intricate patterns"},
        {"id": "examples_diverse", "description": "Examples are diverse (not redundant)"},
        {"id": "queries_concise", "description": "Queries are as short as possible while remaining complete"},
        {"id": "parameters_for_common_values", "description": "Parameters are used for commonly varied values (dates, names, limits)"},
        {"id": "guidance_describes_scenarios", "description": "Usage guidance describes specific scenarios where the query applies"},
        {"id": "guidance_includes_keywords", "description": "Usage guidance includes keywords that should trigger the example"},
    ],
    "instructions.sql_functions": [
        {"id": "udfs_documented", "description": "Custom UDFs are documented in Unity Catalog"},
    ],
    "instructions.join_specs": [
        {"id": "fk_references_defined", "description": "Foreign key references are defined in Unity Catalog when possible"},
        {"id": "complex_joins_explicit", "description": "Complex scenarios (self-joins) have explicit join specs"},
        {"id": "example_queries_show_joins", "description": "Example queries demonstrate standard joins"},
    ],
    "instructions.sql_snippets.filters": [
        {"id": "business_filters_defined", "description": "Business-specific filters are defined (e.g., 'active customers', 'pre-covid')"},
    ],
    "instructions.sql_snippets.expressions": [
        {"id": "expressions_include_synonyms", "description": "Expressions include synonyms for user terminology"},
    ],
    "instructions.sql_snippets.measures": [
        {"id": "measures_cover_business_concepts", "description": "Measures cover standard business concepts used across queries"},
    ],
    "benchmarks.questions": [
        {"id": "questions_tested_reviewed", "description": "Questions have been tested and SQL reviewed"},
        {"id": "questions_different_phrasings", "description": "Questions include different phrasings of the same intent"},
        {"id": "user_feedback_incorporated", "description": "User testing feedback has been incorporated"},
    ],
}


def get_llm_checklist_items_for_section(section_name: str) -> list[dict]:
    """Get the LLM checklist items for a given section.

    Args:
        section_name: Name of the section

    Returns:
        List of dicts with 'id' and 'description' for each LLM item
    """
    return LLM_CHECKLIST_ITEMS.get(section_name, [])


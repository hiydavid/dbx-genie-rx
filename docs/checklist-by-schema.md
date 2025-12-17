# Genie Space Checklist (Organized by Schema)

Based on the [official Databricks Genie Best Practice doc](https://docs.databricks.com/aws/en/genie/best-practices). Last updated 12/16/2025.

This checklist is organized according to the serialized Genie Space JSON schema structure. All items are evaluated by LLM analysis.

---

## `data_sources`

### `tables`

**Table Selection:**

- [ ] At least 1 table is configured
- [ ] Number of tables is 25 or fewer
- [ ] Tables are focused (only necessary tables for intended questions)
- [ ] Tables are well-annotated with descriptions
- [ ] Datasets are simplified (prejoined where appropriate, unnecessary columns removed)

**Column Descriptions:**

- [ ] Columns have descriptions defined
- [ ] Descriptions provide clear, precise contextual information
- [ ] Descriptions avoid duplicating information from column names

**Column Synonyms:**

- [ ] Key columns have synonyms defined
- [ ] Synonyms match how business users naturally refer to the data
- [ ] Common abbreviations and alternative phrasings are included

**Example Values / Value Dictionary:**

- [ ] Filterable columns have `get_example_values` enabled
- [ ] Columns with discrete values have `build_value_dictionary` enabled

**Column Exclusions:**

- [ ] Technical/internal columns are excluded
- [ ] Columns not relevant to the space's purpose are hidden

### `metric_views`

- [ ] Metric views have descriptions (if any exist)
- [ ] Pre-computed metrics have comments explaining valid aggregations

---

## `instructions`

### `text_instructions`

- [ ] At least 1 text instruction exists
- [ ] Instructions are focused and minimal (not excessive)
- [ ] Instructions provide globally-applied context
- [ ] Business jargon is mapped to standard terminology where needed

### `example_question_sqls`

**Example Questions:**

- [ ] At least 1 example question-SQL pair exists
- [ ] Examples cover complex, multi-part, or hard-to-interpret questions
- [ ] SQL queries demonstrate intricate patterns
- [ ] Examples are diverse (not redundant)
- [ ] Queries are as short as possible while remaining complete

**Parameters:**

- [ ] Parameters have descriptions defined (if parameters exist)
- [ ] Parameters are used for commonly varied values (dates, names, limits)

**Usage Guidance:**

- [ ] Usage guidance is provided for complex examples
- [ ] Guidance describes specific scenarios where the query applies
- [ ] Guidance includes keywords that should trigger the example

### `sql_functions`

- [ ] Registered functions exist in Unity Catalog (if any defined)
- [ ] Custom UDFs are documented in Unity Catalog

### `join_specs`

- [ ] Join specs are defined for multi-table relationships (if >1 table)
- [ ] Foreign key references are defined in Unity Catalog when possible
- [ ] Complex scenarios (self-joins) have explicit join specs
- [ ] Example queries demonstrate standard joins

### `sql_snippets`

#### `filters`

- [ ] Common time period filters exist ("last quarter", "YTD")
- [ ] Business-specific filters are defined ("active customers", "pre-covid")

#### `expressions`

- [ ] Reusable expressions are defined for common categorizations
- [ ] Expressions include synonyms for user terminology

#### `measures`

- [ ] Frequently used metrics are defined (gross margin, conversion rate)
- [ ] Measures cover standard business concepts used across queries

---

## `benchmarks`

### `questions`

- [ ] At least 1 benchmark question exists
- [ ] Questions have been tested and SQL reviewed
- [ ] Questions include different phrasings of the same intent
- [ ] User testing feedback has been incorporated

---

## Summary

| Section | Items |
|---------|-------|
| `data_sources.tables` | 15 |
| `data_sources.metric_views` | 2 |
| `instructions.text_instructions` | 4 |
| `instructions.example_question_sqls` | 10 |
| `instructions.sql_functions` | 2 |
| `instructions.join_specs` | 4 |
| `instructions.sql_snippets.filters` | 2 |
| `instructions.sql_snippets.expressions` | 2 |
| `instructions.sql_snippets.measures` | 2 |
| `benchmarks.questions` | 4 |
| **Total** | **47** |

---

## Scoring

**Score Calculation:** `(passed_items / total_items) * 100`

Each checked item contributes equally to the final score. A perfect score requires all 47 items to pass.

---

## Customization

You can customize this checklist by:

- **Adding items**: Add new `- [ ] Description` lines under any section
- **Removing items**: Delete any checklist item line
- **Modifying items**: Edit the description text of any item

**Note**: The section structure must match the Genie Space schema. Do not add new sections - only modify items within existing sections.

# Genie Space Checklist (Organized by Schema)

Based on the [best practices documentation](best-practices-by-schema.md). Each item is tagged:
- **[P]** = Programmatic check (verified automatically)
- **[L]** = LLM evaluation (requires qualitative assessment)

---

## `config`

### `sample_questions`

- [ ] **[P]** At least 1 sample question exists
- [ ] **[L]** Questions demonstrate the space's core capabilities
- [ ] **[L]** Questions reflect real business user needs
- [ ] **[L]** Questions are focused on the space's defined purpose

---

## `data_sources`

### `tables`

**Table Selection:**
- [ ] **[P]** At least 1 table is configured
- [ ] **[P]** Number of tables is 25 or fewer
- [ ] **[L]** Tables are focused (only necessary tables for intended questions)
- [ ] **[L]** Tables are well-annotated with descriptions
- [ ] **[L]** Datasets are simplified (prejoined where appropriate, unnecessary columns removed)

**Column Descriptions:**
- [ ] **[P]** Columns have descriptions defined
- [ ] **[L]** Descriptions provide clear, precise contextual information
- [ ] **[L]** Descriptions avoid duplicating information from column names

**Column Synonyms:**
- [ ] **[P]** Key columns have synonyms defined
- [ ] **[L]** Synonyms match how business users naturally refer to the data
- [ ] **[L]** Common abbreviations and alternative phrasings are included

**Example Values / Value Dictionary:**
- [ ] **[P]** Filterable columns have `get_example_values` enabled
- [ ] **[P]** Columns with discrete values have `build_value_dictionary` enabled

**Column Exclusions:**
- [ ] **[P]** Technical/internal columns are excluded
- [ ] **[L]** Columns not relevant to the space's purpose are hidden

### `metric_views`

- [ ] **[P]** Metric views have descriptions (if any exist)
- [ ] **[L]** Pre-computed metrics have comments explaining valid aggregations

---

## `instructions`

### `text_instructions`

- [ ] **[P]** At least 1 text instruction exists
- [ ] **[L]** Instructions are focused and minimal (not excessive)
- [ ] **[L]** Instructions provide globally-applied context
- [ ] **[L]** Business jargon is mapped to standard terminology where needed
- [ ] **[L]** Time zone handling is specified if applicable

### `example_question_sqls`

**Example Questions:**
- [ ] **[P]** At least 1 example question-SQL pair exists
- [ ] **[L]** Examples cover complex, multi-part, or hard-to-interpret questions
- [ ] **[L]** SQL queries demonstrate intricate patterns
- [ ] **[L]** Examples are diverse (not redundant)
- [ ] **[L]** Queries are as short as possible while remaining complete

**Parameters:**
- [ ] **[P]** Parameters have descriptions defined (if parameters exist)
- [ ] **[L]** Parameters are used for commonly varied values (dates, names, limits)

**Usage Guidance:**
- [ ] **[P]** Usage guidance is provided for complex examples
- [ ] **[L]** Guidance describes specific scenarios where the query applies
- [ ] **[L]** Guidance includes keywords that should trigger the example

### `sql_functions`

- [ ] **[P]** Registered functions exist in Unity Catalog (if any defined)
- [ ] **[L]** Custom UDFs are documented in Unity Catalog

### `join_specs`

- [ ] **[P]** Join specs are defined for multi-table relationships (if >1 table)
- [ ] **[L]** Foreign key references are defined in Unity Catalog when possible
- [ ] **[L]** Complex scenarios (self-joins) have explicit join specs
- [ ] **[L]** Example queries demonstrate standard joins

### `sql_snippets`

#### `filters`

- [ ] **[P]** Common time period filters exist ("last quarter", "YTD")
- [ ] **[L]** Business-specific filters are defined ("active customers", "pre-covid")

#### `expressions`

- [ ] **[P]** Reusable expressions are defined for common categorizations
- [ ] **[L]** Expressions include synonyms for user terminology

#### `measures`

- [ ] **[P]** Frequently used metrics are defined (gross margin, conversion rate)
- [ ] **[L]** Measures cover standard business concepts used across queries

---

## `benchmarks`

### `questions`

- [ ] **[P]** At least 1 benchmark question exists
- [ ] **[L]** Questions have been tested and SQL reviewed
- [ ] **[L]** Questions include different phrasings of the same intent
- [ ] **[L]** User testing feedback has been incorporated

---

## Summary

| Section | Programmatic | LLM-Evaluated | Total |
|---------|--------------|---------------|-------|
| `config.sample_questions` | 1 | 3 | 4 |
| `data_sources.tables` | 7 | 8 | 15 |
| `data_sources.metric_views` | 1 | 1 | 2 |
| `instructions.text_instructions` | 1 | 4 | 5 |
| `instructions.example_question_sqls` | 3 | 7 | 10 |
| `instructions.sql_functions` | 1 | 1 | 2 |
| `instructions.join_specs` | 1 | 3 | 4 |
| `instructions.sql_snippets.filters` | 1 | 1 | 2 |
| `instructions.sql_snippets.expressions` | 1 | 1 | 2 |
| `instructions.sql_snippets.measures` | 1 | 1 | 2 |
| `benchmarks.questions` | 1 | 3 | 4 |
| **Total** | **19** | **33** | **52** |

---

## Scoring

**Score Calculation:** `(passed_items / total_items) * 100`

Each checked item contributes equally to the final score. A perfect score requires all 52 items to pass.

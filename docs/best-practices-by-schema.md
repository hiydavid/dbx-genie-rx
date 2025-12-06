# Genie Space Best Practices (Organized by Schema)

This document reorganizes Genie space best practices according to the JSON schema structure.

---

## `config`

### `sample_questions`

Sample questions are displayed to users when they first open the space.

**Best Practices:**

- Include questions that demonstrate the space's core capabilities
- Use questions that reflect real business user needs
- Keep questions focused on the space's defined purpose

---

## `data_sources`

### `tables`

**Best Practices:**

- **Stay focused**: Include only the tables necessary to answer the questions you want the space to handle. Aim for five or fewer tables.

- **Work within the 25 table limit**: If your data topic requires more than 25 tables, prejoin related tables into views before adding them to your space.

- **Build on well-annotated tables**: Genie uses Unity Catalog column names and descriptions to generate responses.

- **Simplify datasets**: Prejoining tables and removing unnecessary columns before adding data improves accuracy.

**Troubleshooting - Incorrect Table Usage:**

- Check that metadata terminology matches user terminology
- Remove unnecessary or overlapping tables

### `metric_views`

**Best Practices:**

- Use metric views for pre-computed aggregations
- Explain in table comments if metrics are pre-computed and specify valid aggregations

### `column_configs`

#### `description`

**Best Practices:**

- Provide clear, precise contextual information
- Avoid duplicating information already conveyed by column names

**Troubleshooting - Foreign Table Comments:**

- Edit column metadata in the Genie space UI
- Create materialized views on top of federated tables

#### `synonyms`

**Best Practices:**

- Add synonyms matching how business users naturally refer to the data
- Include common abbreviations and alternative phrasings

#### `get_example_values` / `build_value_dictionary`

**Best Practices:**

- Enable example values for columns users frequently filter on
- Build value dictionaries for columns with discrete values
- Refresh values when new data is added

**Troubleshooting - Filtering Errors:**

When Genie filters for wrong values (e.g., "California" instead of "CA"):

- Verify columns have **Example values** and **Value dictionaries** enabled
- Refresh values if new data was added

#### `exclude`

**Best Practices:**

- Hide columns not relevant to the space's purpose
- Hide technical columns users don't need
- Reduces token usage and improves response quality

---

## `instructions`

### `text_instructions`

**Best Practices:**

- Keep instructions focused and minimal
- Too many instructions can reduce effectiveness
- Use for globally-applied context

**Troubleshooting - Misunderstood Business Jargon:**

- Map business jargon to standard terminology (e.g., "year" = fiscal year starting February)

**Troubleshooting - Time-based Calculations:**

```text
- Time zones in the tables are in UTC.
- Convert all timezones using: convert_timezone('UTC', 'America/Los_Angeles', <column>).
```

**Troubleshooting - Ignoring Instructions:**

- Start a new chat
- Remove irrelevant instructions and tables

### `example_question_sqls`

**Best Practices:**

- Use for complex, multi-part, or hard-to-interpret questions
- Provide complete SQL queries showing intricate patterns
- Include diverse examples, remove redundant ones
- Keep queries as short as possible

**Good candidates:**

- "breakdown my team's performance"
- "For customers who've only joined recently, what products are doing the best?"

#### `parameters`

**Best Practices:**

- Use for commonly varied values (dates, names, limits)
- Provide clear descriptions for each parameter

#### `usage_guidance`

**Best Practices:**

- Describe specific scenarios where the query applies
- Include keywords that should trigger this example

### `sql_functions`

**Best Practices:**

- Register frequently-used custom UDFs
- Ensure functions are documented in Unity Catalog

### `join_specs`

**Best Practices:**

1. Define foreign key references in Unity Catalog when possible
2. Use join specs for complex scenarios (self-joins) or when you can't modify underlying tables
3. Provide example queries showing standard joins
4. Pre-join tables into views if other approaches fail

**Troubleshooting - Incorrect Joins:**

- Check if foreign keys are defined in Unity Catalog
- Add join specs to the knowledge store
- Consider pre-joined views

### `sql_snippets`

#### `filters`

**Best Practices:**

- Create filters for frequently-used time periods ("last quarter", "YTD")
- Include business-specific filters ("active customers", "pre-covid")

#### `expressions`

**Best Practices:**

- Use for common categorizations or derivations
- Include synonyms for user terminology

#### `measures`

**Best Practices:**

- Define frequently used metrics (gross margin, conversion rate)
- Use for standard business concepts across multiple queries

**Troubleshooting - Metric Calculation Issues:**

- Provide example SQL for roll-up values
- Document pre-computed metrics in table comments
- Create views with pre-aggregated metrics

---

## `benchmarks`

### `questions`

**Best Practices:**

- Be your space's first user—test and examine generated SQL
- Add reviewed questions as benchmarks
- Test with different phrasings
- Conduct user testing with business users:
  1. Set expectations for refinement
  2. Focus on specific topics
  3. Encourage chat-based refinement
  4. Use upvote/downvote feedback
  5. Collect direct feedback

---

## Performance and Limits

**Token Limits:**

- Remove/hide unnecessary columns
- Streamline column descriptions
- Prune redundant example queries
- Simplify instructions

**Performance Issues:**

- Use trusted assets or views for complex queries
- Reduce example SQL length
- Start new chat if responses slow down

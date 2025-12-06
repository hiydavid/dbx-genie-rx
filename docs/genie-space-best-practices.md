# Curate an Effective Genie Space

> **Source:** [Databricks Documentation](https://docs.databricks.com/aws/en/genie/best-practices)  
> **Last updated:** Nov 5, 2025

---

## Overview

The goal of curating a Genie space is to create an environment where business users can pose natural language questions and receive accurate, consistent answers based on their data. Genie spaces use advanced models that generate sophisticated queries and understand general world knowledge.

Most business questions are domain-specific, so a space curator's role is to bridge the gap between that general world knowledge and the specialized language used in a specific domain or by a particular company. Curators use metadata and instructions to help Genie accurately interpret and respond to business users' questions. This article outlines best practices and principles to guide you in developing a successful space.

---

## Best Practices for Defining a New Space

### Start Small

Curating a Genie space is an iterative process. When creating a new space, start as small as possible, with minimal instructions and a limited set of questions to answer. Then, you can add as you iterate based on feedback and monitoring. This approach helps streamline creating and maintaining your space and allows you to curate it effectively in response to real user needs.

Use the following guidelines to help create a small Genie space:

- **Stay focused**: Include only the tables necessary to answer the questions you want the space to handle. Aim for five or fewer tables. The more focused your selection, the better. Keeping your space narrowly focused on a small amount of data is ideal, so limit the number of columns in your included tables.

- **Work within the 25 table limit**: Genie spaces support up to 25 tables or views. If your data topic requires more than 25 tables, prejoin related tables into views before adding them to your space. This approach helps you stay within the limit, simplifies your data model, and can improve Genie's response accuracy. See [Manage data objects](https://docs.databricks.com/aws/en/genie/set-up#manage-data) for details on adding data objects to your space.

- **Plan to iterate**: Start with a minimal setup for your space, focusing on essential tables and basic instructions. Add more detailed guidance and examples as you refine the space over time, rather than aiming for perfection initially.

- **Build on well-annotated tables**: Genie uses Unity Catalog column names and descriptions to generate responses. Clear column names and descriptions help produce high-quality responses. Column descriptions should offer precise contextual information. Avoid ambiguous or unnecessary details. Inspect any AI-generated descriptions for accuracy and clarity, and use them only if they align with what you would manually provide.

---

### Have a Domain Expert Define the Space

An effective space creator needs to understand the data and the insights that can be gleaned from it. Data analysts who are proficient in SQL typically have the knowledge and skills to curate the space.

---

### Define the Purpose of Your Space

Identifying your space's specific audience and purpose helps you decide which data, instructions, and test questions to use. A space should answer questions for a particular topic and audience, not general questions across various domains. 

You can simplify your datasets by prejoining tables and removing unnecessary columns before adding data to a space. As you add data to your space, keep it tightly focused on the space's defined purpose. Hide any columns that might be confusing or unimportant. See [Hide or show relevant columns](https://docs.databricks.com/aws/en/genie/knowledge-store#show-hide-column).

---

### Add Metadata and Synonyms

You can add column synonyms and custom descriptions to data in a Genie space. This metadata is scoped to your Genie space and does not overwrite metadata stored in Unity Catalog. 

Quality column descriptions and synonyms help Genie understand the column better, choose it for relevant questions, and write more accurate SQL. See [Edit column metadata](https://docs.databricks.com/aws/en/genie/knowledge-store#edit-column-metadata).

---

### Use Genie Data Sampling

Data sampling improves Genie's accuracy by sampling values from datasets in the space, helping it better match user prompts to the correct columns and values. Genie automatically samples values from tables as you create the space. You can manage which columns have data sampled. 

See [Manage data objects](https://docs.databricks.com/aws/en/genie/set-up#manage-data) and [Build a knowledge store for more reliable Genie spaces](https://docs.databricks.com/aws/en/genie/knowledge-store).

---

### Provide Focused Examples and Instructions

Genie spaces perform best with a limited, focused set of instructions. Databricks recommends leveraging example SQL queries to provide instructions in your space. Example SQL queries allow Genie to match user prompts to verified SQL queries and learn from examples to answer related questions. See [Add example SQL queries and functions](https://docs.databricks.com/aws/en/genie/set-up#example-queries).

For context that should be applied globally in the Genie space, a small, well-organized set of plain text instructions can also help maintain relevance and improve response quality. Too many instructions can reduce effectiveness, especially in longer conversations, because Genie might struggle to prioritize the most important guidance. For details, see [Provide instructions](https://docs.databricks.com/aws/en/genie/set-up#provide-instructions).

---

### Choose the Right Instruction Type

Use the following guidelines to decide between SQL expressions and example SQL queries:

#### Use SQL Expressions for Common Business Terms
When defining frequently used metrics, filters, or dimensions that represent standard business concepts, use SQL expressions in the knowledge store. SQL expressions are efficient, reusable definitions that help Genie understand your business logic. 

**Examples include:** gross margin, recent sales, and conversion rate.

See [Define SQL expressions](https://docs.databricks.com/aws/en/genie/knowledge-store#sql-expressions).

#### Use Example SQL Queries for Complex Questions
When addressing hard-to-interpret, multi-part, or complex questions, provide complete example SQL queries. These examples show Genie how to handle intricate query patterns and multi-step logic.

**Example prompts:**
- "breakdown my team's performance"
- "For customers who've only joined recently, what products are doing the best?"

See [Add example SQL queries and functions](https://docs.databricks.com/aws/en/genie/set-up#example-queries).

---

### Test and Adjust

You should be your space's first user. After you create a new space, start asking questions. Carefully examine the SQL generated in response to your questions. If Genie misinterprets the data, questions, or business jargon, you can intervene by editing the generated SQL or providing other specific instructions. Keep testing and editing until you're getting reliable responses.

After you've reviewed a question, you can add it as a benchmark question that you can use to test and score your space for overall accuracy systematically. You can use variations and different question phrasings to test Genie's responses. See [Use benchmarks in a Genie space](https://docs.databricks.com/aws/en/genie/benchmarks).

See [Troubleshooting](#troubleshooting) for ideas on fixing erroneous responses.

---

### Conduct User Testing

After verifying response quality through testing, recruit a business user to try the Genie space. Use the following guidelines to provide a smooth user journey and collect feedback for ongoing improvement:

1. **Set expectations** that their job is to help refine the space.

2. **Ask them to focus** their testing on the specific topic and questions the space is designed to answer.

3. **Encourage refinement**: If they receive an incorrect response, encourage users to add additional instructions and clarifications in the chat to refine the answer. When a correct response is provided, they should upvote the final query to minimize similar errors in future interactions.

4. **Use feedback mechanisms**: Tell users to upvote or downvote responses using the built-in feedback mechanism.

5. **Collect direct feedback**: Invite users to share additional feedback and unresolved questions directly with the space authors. Authors and editors can use feedback to refine instructions, examples, and trusted assets.

Consider providing training materials or a written document with guidelines for testing the space and providing feedback. Direct business users to [Use a Genie space to explore business data](https://docs.databricks.com/aws/en/genie/talk-to-genie) to help them start working with a new Genie space.

As business users test the space, users with at least CAN MANAGE permissions can see the questions they've asked on the **Monitoring** tab. Continue adding context to help Genie correctly interpret the questions and data to provide accurate answers. See [Monitor the space](https://docs.databricks.com/aws/en/genie/set-up#history) to learn more about monitoring Genie spaces. You can also use audit logs to monitor Genie space feedback and review requests. See [Monitor AI/BI usage with audit logs and alerts](https://docs.databricks.com/aws/en/ai-bi/admin/audit).

> **Note:** Business users must be members of the originating workspace to access your space. See [Required permissions](https://docs.databricks.com/aws/en/genie/set-up#required-permissions) to learn how to provide the appropriate permissions to interact with the space.

---

## Troubleshooting

### Misunderstood Business Jargon

Most companies or domains have specific shorthand they use to communicate about business-specific events. For example, when referring to a year, it might always mean the fiscal year, and this fiscal year might start in February or March instead of January. 

**Solution:** To enable Genie to answer these questions naturally and accurately, include instructions that explicitly map your business jargon to words and concepts Genie can understand. See [Provide instructions](https://docs.databricks.com/aws/en/genie/set-up#provide-instructions).

---

### Incorrect Table or Column Usage

If Genie is attempting to pull data from an incorrect table or run analysis on incorrect columns, you might adjust the data in one of the following ways:

- **Provide clear and precise descriptions**: Check your tables and associated metadata to verify that the terminology used there matches the users' terminology in submitted questions. If it does not, refine the description or add an instruction that maps the terminology used in the table to the terminology used in the question.

- **Add example queries**: Provide sample SQL queries that Genie can use to learn how to respond to certain questions. See [Provide instructions](https://docs.databricks.com/aws/en/genie/set-up#provide-instructions).

- **Remove tables or columns from the space**: Some tables might include overlapping columns or concepts that make it difficult for Genie to know which data to use in a response. If possible, remove unnecessary or overlapping tables or columns. To quickly hide columns from the Genie space UI, without changing the underlying data objects, see [Hide or show relevant columns](https://docs.databricks.com/aws/en/genie/knowledge-store#show-hide-column).

---

### Filtering Errors

Generated queries often include a `WHERE` clause to filter results according to a specific value. When Genie doesn't have visibility into the data values, it might set the `WHERE` clause to filter for the wrong value. For example, it might try to match the name "California" when the table uses abbreviations like "CA."

**Solution:** For situations like this, verify that relevant columns have **Example values** and **Value dictionaries** enabled. If new data has been added to relevant tables, refresh the values. See [Build a knowledge store for more reliable Genie spaces](https://docs.databricks.com/aws/en/genie/knowledge-store).

---

### Incorrect Joins

If foreign key references are not defined in Unity Catalog, your space might not know how to join different tables together.

**Try implementing one or more of the following solutions:**

1. **Define foreign key references** in your Unity Catalog when possible. See [CONSTRAINT clause](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-syntax-ddl-create-table-constraint).

2. **Define join relationships in your Genie space's knowledge store** if your tables' foreign key relationships are not specified in Unity Catalog. This strategy is helpful for more complex join scenarios like self-joins, or if you don't have sufficient permission to modify the underlying tables. See [Define join relationships](https://docs.databricks.com/aws/en/genie/knowledge-store#join-overview).

3. **Provide example queries** where you join tables together in standard ways.

4. **Pre-join tables into a view** and use that as input for the space instead (if none of the above resolve the problem).

---

### Column Comments Not Syncing from Foreign Tables

Databricks does not manage the metadata, data, or semantics for writes to foreign tables. Depending on the source table, comments might not be accessible from Databricks. 

**To make comments available, Databricks recommends:**

- **Edit column metadata in the Genie space UI.** Edited metadata applies only to the Genie space where it is written. See [Edit column metadata](https://docs.databricks.com/aws/en/genie/knowledge-store#edit-column-metadata).

- **Create materialized views on top of federated tables.** You can add and edit comments on a materialized view as you would on a managed table. You can reuse this view across multiple Genie spaces. For details about loading data from foreign tables to a materialized view, see [Load data from foreign tables with materialized views](https://docs.databricks.com/aws/en/query-federation/database-federation#load). To learn more about working with materialized views, see [Materialized views](https://docs.databricks.com/aws/en/ldp/materialized-views).

---

### Metric Calculation Issues

The way that metrics are computed and rolled up can be arbitrarily complicated and encompass many business details that your space doesn't understand. This can lead to incorrect reporting.

**Try implementing one or more of the following solutions:**

- If your metrics are aggregated from base tables, **provide example SQL queries** computing each roll-up value.

- If your metrics have been pre-computed and are sitting in aggregated tables, **explain this in table comments**. Specify valid aggregations for each metric if the metrics in that table can be further rolled up.

- If the SQL you're trying to generate is very complicated, try **creating views** that have already aggregated your metrics for your space.

---

### Incorrect Time-based Calculations

Genie might not always be able to infer the timezone represented in the data or the timezone in which your analysis needs to be performed unless you explicitly provide additional guidance.

**Solution:** Include more explicit instructions detailing the original source timezone, the conversion function, and the target timezone.

#### Example: Always Convert Times to a Specific Timezone

Assume that the source timestamp is `UTC` and you want results in the `America/Los_Angeles` timezone. Add the following to the instructions, replacing `<timezone-column>` with the appropriate column name:

```
- Time zones in the tables are in UTC.
- Convert all timezones using the following function: convert_timezone('UTC', 'America/Los_Angeles', <timezone-column>).
```

#### Example: Convert Non-UTC Datetime Formats to UTC

If the workspace default timezone is `UTC` but users in Los Angeles must reference *today* for a specific set of records, add the following to the space's general instructions:

```
- To reference *today*, use date(convert_timezone('UTC', 'America/Los_Angeles', current_timestamp())).
```

See [`convert_timezone` function](https://docs.databricks.com/aws/en/sql/language-manual/functions/convert_timezone) for more details and syntax.

---

### Ignoring Instructions

Even if you have explained your tables and columns in comments and provided general instructions, your space might still not be using them correctly.

**Try one or more of the following strategies:**

- **Provide example queries** that use your tables correctly. Example queries are especially effective for teaching your space how to use your data.

- **Hide irrelevant columns** in the Genie space. See [Hide or show relevant columns](https://docs.databricks.com/aws/en/genie/knowledge-store#show-hide-column).

- **Create views** from your tables that provide a simpler view of your data.

- **Review your instructions** and try to focus the space by removing irrelevant tables or instructions.

- **Try starting a new chat.** Previous interactions might influence Genie's responses in any given chat, but starting a new chat gives you a blank starting point for testing new instructions.

---

### Performance Issues

When Genie needs to generate exceptionally long queries or text responses, it can take a long time to respond or even time out during the thinking phase.

**Try one or more of the following actions to improve performance:**

- **Use trusted assets or views** to encapsulate complex queries. See [Use trusted assets in AI/BI Genie spaces](https://docs.databricks.com/aws/en/genie/trusted-assets).

- **Reduce the length** of your example SQL queries whenever possible.

- **Start a new chat** if Genie starts to generate slow or failing responses.

---

### Unreliable Responses to Mission-Critical Questions

**Solution:** Use trusted assets to provide verified answers to specific questions that you expect users to ask. See [Use trusted assets in AI/BI Genie spaces](https://docs.databricks.com/aws/en/genie/trusted-assets).

---

### Token Limit Warning

Tokens are the basic units of text that Genie uses to process and understand language. Text instructions and metadata in a Genie space are converted into tokens. If your space approaches the token limit, a warning appears. Genie uses context filtering to prioritize the tokens it considers most relevant to a question. While responses should still be generated when a warning appears, quality may be reduced if important context is filtered out. When the token limit is exceeded, you can no longer send or receive messages in the Genie space.

**Consider the following practices to reduce the token count:**

- **Remove unnecessary columns**: Unnecessary columns in your tables can significantly contribute to token usage. When possible, create views to exclude redundant or non-essential fields from your raw tables. You can also hide unneeded columns in a Genie space. See [Hide or show relevant columns](https://docs.databricks.com/aws/en/genie/knowledge-store#show-hide-column).

- **Streamline column descriptions**: While column descriptions are important, avoid duplicating information already conveyed by column names. For example, if a column is named `account_name`, a description like "the name of your account" might be redundant and can be omitted.

- **Edit column metadata in the Genie space**: See [Edit column metadata](https://docs.databricks.com/aws/en/genie/knowledge-store#edit-column-metadata) to learn how to edit descriptions and provide synonyms in column metadata.

- **Prune example SQL queries**: Include a diverse range of example SQL queries to cover various types of questions, but remove overlapping or redundant examples.

- **Simplify instructions**: Verify that your instructions are clear and concise. Avoid unnecessary words.

---

### Your Account is Not Enabled for Cross-Geo Processing

Genie is a [Designated Service](https://docs.databricks.com/aws/en/resources/designated-services) managed by Databricks. Designated Services use Databricks Geos to manage data residency. Data cannot be processed in the same Geo as the workspace for some regions. If your workspace is in one of those regions, [cross-Geo processing](https://docs.databricks.com/aws/en/resources/databricks-geos#enable-cross-geo-processing) must be enabled by your account administrator.

---

### Reaching Throughput Limits

**UI Access:** When accessing Genie spaces through the Databricks UI, throughput is limited to **20 questions per minute per workspace**, across all Genie spaces.

**API Access:** When accessing Genie spaces using the Conversation API's free tier (Public Preview), throughput is limited to a best effort **5 questions per minute per workspace**, across all Genie spaces. See [Use the Genie API to integrate Genie into your applications](https://docs.databricks.com/aws/en/genie/conversation-api).

---

## Related Documentation

- [Set up and manage an AI/BI Genie space](https://docs.databricks.com/aws/en/genie/set-up)
- [Build a knowledge store for more reliable Genie spaces](https://docs.databricks.com/aws/en/genie/knowledge-store)
- [Use benchmarks in a Genie space](https://docs.databricks.com/aws/en/genie/benchmarks)
- [Use trusted assets in AI/BI Genie spaces](https://docs.databricks.com/aws/en/genie/trusted-assets)
- [Use the Genie API to integrate Genie into your applications](https://docs.databricks.com/aws/en/genie/conversation-api)

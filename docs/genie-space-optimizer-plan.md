# Genie Space Optimizer — Project Plan

## 1. Core Concept

You're building an **LLM-powered lint/optimization tool** that:
- Ingests a Genie Space definition (via GET API or JSON export)
- Analyzes each metadata section against best practices
- Generates actionable recommendations
- Outputs an optimized JSON payload ready for the Update API

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Visual Frontend                          │
│  (React/Streamlit app showing section-by-section analysis)      │
└─────────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    Optimization Engine                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Section Analyzer │  │ Best Practice    │  │ Recommendation│  │
│  │ (LLM + Rules)    │  │ RAG Index        │  │ Generator     │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌─────────────────────────────────────────────────────────────────┐
│              Genie Space Ingestion Layer                        │
│   GET /api/2.0/genie/spaces/{space_id}  ───► JSON Parser        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Components of a Genie Space to Analyze

Based on the API and docs, here are the sections your tool should analyze:

| Section | What to Check | Best Practice Signal |
|---------|---------------|---------------------|
| **Tables/Views** | Count (max 25), relevance, pre-joined vs raw | Focused dataset, hidden unnecessary columns |
| **Column Metadata** | Descriptions, synonyms, visibility | Every exposed column has business-friendly description |
| **Value Sampling** | Enabled columns, dictionary coverage | Categorical columns have dictionaries; PII excluded |
| **Join Relationships** | Defined FK/PK, self-join handling | Explicit joins for non-UC-defined relationships |
| **SQL Expressions** | Measures, filters, dimensions defined | Common business metrics encapsulated |
| **Example SQL Queries** | Count, parameterization, coverage | 5+ verified queries covering key question patterns |
| **General Instructions** | Length, clarity, conflicts | Concise (<100 lines), no ambiguity |
| **Sample Questions** | Count, diversity | Representative of expected user questions |
| **Benchmarks** | Coverage, accuracy scores | 5+ benchmark questions with passing scores |

---

## 4. Implementation Phases

### Phase 1: Schema Discovery & Ingestion
- Call `GET /api/2.0/genie/spaces/{space_id}` to pull the serialized space
- Parse and normalize the JSON structure into analyzable sections
- Build a **Pydantic model** for the Genie Space schema (for validation and typed access)

### Phase 2: Best Practices Knowledge Base
- Scrape/ingest the Databricks documentation:
  - `docs.databricks.com/genie/best-practices`
  - `docs.databricks.com/genie/knowledge-store`
  - `docs.databricks.com/genie/set-up`
- Chunk and embed into a **vector store** (could use Databricks Vector Search, or local FAISS)
- Create rule-based checks for quantitative things (column count, query count, etc.)

### Phase 3: Section Analyzers
For each section, build an analyzer that:
1. **Extracts** the relevant portion of the Genie Space JSON
2. **Retrieves** relevant best-practice context via RAG
3. **Prompts** an LLM to evaluate against criteria and generate:
   - A quality score (1-5 or red/yellow/green)
   - Specific issues found
   - Concrete recommendations
   - (Optionally) auto-generated fixes

Example prompt structure:
```
You are a Genie Space quality auditor. 

SECTION: Column Metadata for table `sales_orders`
CURRENT STATE:
{json blob of columns with descriptions}

BEST PRACTICES:
{retrieved chunks from docs}

Analyze this section and provide:
1. Quality Score (1-5)
2. Issues Found (list)
3. Recommendations (list)
4. Suggested Improvements (JSON patch if applicable)
```

### Phase 4: Recommendation Aggregator
- Combine all section analyses into a unified report
- Prioritize by impact (e.g., missing column descriptions > suboptimal sampling)
- Generate a summary view and detailed drill-down

### Phase 5: Visual Frontend
Build a UI (React or Streamlit) that shows:
- **Overview Dashboard**: Overall health score, section-by-section summary
- **Section Drill-downs**: Expandable panels for each section with issues/recommendations
- **Side-by-side Diff**: Current vs. recommended state
- **Export**: Generate optimized JSON for `PUT /api/2.0/genie/spaces/{space_id}`

---

## 5. Tech Stack Recommendation

| Component | Technology |
|-----------|------------|
| Backend API | FastAPI (Python) |
| LLM | Claude via Databricks Model Serving, or direct API |
| Vector Store | Databricks Vector Search or FAISS |
| Frontend | Streamlit (fast prototyping) or React (production) |
| Deployment | Databricks App (uses the new Apps framework) |
| Auth | OAuth M2M via service principal for Genie API calls |

---

## 6. Sample Workflow

```
User enters Genie Space ID
         │
         ▼
    Fetch space JSON via API
         │
         ▼
    Parse into sections
         │
         ▼
  ┌──────┴──────┐
  │   For each  │
  │   section   │──────┐
  └─────────────┘      │
         │             │
         ▼             │
   RAG lookup for      │
   best practices      │
         │             │
         ▼             │
   LLM analysis        │
         │             │
         ▼             │
   Score + Recs        │
         │             │
         └─────────────┘
         │
         ▼
   Aggregate results
         │
         ▼
   Render in UI
         │
         ▼
   (Optional) Generate optimized JSON
         │
         ▼
   Update via PUT API
```

---

## 7. Quick Wins to Start

1. **Start with GET API exploration**: Pull a real Genie Space and document the actual JSON structure
2. **Build one analyzer first**: Column metadata is a good starting point—high impact, well-documented best practices
3. **Use Claude directly in an artifact**: For prototyping, you could build a React app that takes pasted JSON and runs analysis via the API-in-artifacts capability
4. **Iterate on prompts**: The quality of analysis will depend heavily on prompt engineering against the best practices corpus

---

## 8. Key Databricks Documentation References

- [Set up and manage a Genie space](https://docs.databricks.com/aws/en/genie/set-up)
- [Curate an effective Genie space (Best Practices)](https://docs.databricks.com/aws/en/genie/best-practices)
- [Build a knowledge store for more reliable Genie spaces](https://docs.databricks.com/aws/en/genie/knowledge-store)
- [Use the Genie API](https://docs.databricks.com/aws/en/genie/conversation-api)
- [Genie API Reference](https://docs.databricks.com/api/workspace/genie)

---

## Next Steps

Choose where to start:
- [ ] Pull a real Genie Space JSON and document the schema
- [ ] Build Pydantic models for typed access
- [ ] Create a single section analyzer (e.g., Column Metadata)
- [ ] Set up RAG index with best practices docs
- [ ] Prototype Streamlit UI

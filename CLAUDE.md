# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GenieRX is an LLM-powered linting tool that analyzes Databricks Genie Space configurations against best practices. It evaluates 11 configuration sections, provides severity-based findings with remediation guidance, and outputs compliance scores.

## Development Commands

```bash
# Local development setup (creates .env.local, sets up MLflow experiment)
./scripts/quickstart.sh

# Run Streamlit UI (localhost:8501)
uv run streamlit run app.py

# Run REST API server (localhost:8000)
uv run start-server
uv run start-server --reload  # with hot-reload

# Test with a specific Genie Space
python test_agent.py --genie-space-id <id>

# Deploy to Databricks Apps
./scripts/deploy.sh genie-space-analyzer
```

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Streamlit UI   │────▶│ GenieSpaceAnalyzer   │────▶│ Databricks LLM   │
│  (app.py)       │     │ (agent_server/)      │     │ (Claude Sonnet)  │
└─────────────────┘     └──────────────────────┘     └──────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Databricks API   │  │  Best Practices  │  │  MLflow Traces   │
│ (Genie Spaces)   │  │  (docs/*.md)     │  │  (Databricks)    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Core Components

| File | Purpose |
|------|---------|
| `app.py` | Multi-phase Streamlit wizard: Input → Ingest Preview → Section Analysis → Summary |
| `agent_server/agent.py` | `GenieSpaceAnalyzer` class with LLM integration, MLflow tracing, streaming |
| `agent_server/auth.py` | OBO authentication for Databricks Apps, PAT token for local dev |
| `agent_server/ingest.py` | Databricks SDK wrapper for fetching Genie Space configs |
| `agent_server/models.py` | Pydantic models: `AgentInput`, `AgentOutput`, `Finding`, `SectionAnalysis` |
| `agent_server/prompts.py` | LLM prompt templates for section analysis |

### Analyzed Sections (11)

1. `config.sample_questions` - Sample questions shown to users
2. `data_sources.tables` - Table configurations and metadata
3. `data_sources.metric_views` - Metric view definitions
4. `instructions.text_instructions` - Natural language instructions
5. `instructions.example_question_sqls` - Example question-SQL pairs
6. `instructions.sql_functions` - Custom SQL function definitions
7. `instructions.join_specs` - Table join specifications
8. `instructions.sql_snippets.filters` - Reusable filter snippets
9. `instructions.sql_snippets.expressions` - Reusable expression snippets
10. `instructions.sql_snippets.measures` - Reusable measure snippets
11. `benchmarks.questions` - Benchmark question configurations

## Key Patterns

- **MLflow Tracing**: All LLM calls traced with session grouping via `mlflow.start_span()`
- **Streaming**: `predict_streaming()` yields progressive updates during analysis
- **OBO Auth**: In Databricks Apps, uses on-behalf-of tokens; locally uses PAT from `.env.local`
- **Lazy Init**: Singleton pattern for `GenieSpaceAnalyzer` instance in `app.py`

## Environment Configuration

Required in `.env.local` (created by quickstart.sh):
```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_CONFIG_PROFILE=DEFAULT   # or DATABRICKS_TOKEN for PAT
MLFLOW_EXPERIMENT_ID=<id>           # MLflow experiment for tracing
LLM_MODEL=databricks-claude-sonnet-4
```

## Technology Stack

- Python 3.13+, Streamlit 1.40+, Databricks SDK 0.38+, MLflow 3.6+
- Package manager: `uv` (required)
- Build backend: Hatchling
- LLM: Databricks-hosted Claude Sonnet via OpenAI SDK

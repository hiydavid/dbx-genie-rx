# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GenieRX is an LLM-powered linting tool that analyzes Databricks Genie Space configurations against best practices. It evaluates 11 configuration sections using a hybrid approach (programmatic checks + LLM evaluation), provides severity-based findings with remediation guidance, and outputs compliance scores.

## Development Commands

```bash
# Initial setup (creates .env.local, sets up MLflow experiment)
./scripts/quickstart.sh

# Backend server (localhost:5001)
uv run start-server
uv run uvicorn agent_server.start_server:app --reload --port 5001  # with hot-reload

# Frontend development (localhost:5173, proxies to backend)
cd frontend && npm run dev

# Build frontend for production
./scripts/build.sh

# Deploy to Databricks Apps
./scripts/deploy.sh genie-space-analyzer
```

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  React Frontend │────▶│  FastAPI + Agent     │────▶│ Databricks LLM   │
│  (frontend/)    │     │  (agent_server/)     │     │ (Claude Sonnet)  │
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
| `agent_server/agent.py` | `GenieSpaceAnalyzer` class with LLM integration, MLflow tracing, streaming |
| `agent_server/api.py` | REST API endpoints for frontend (`/api/space/fetch`, `/api/analyze/section`, etc.) |
| `agent_server/checks.py` | Programmatic checks and LLM checklist item definitions per section |
| `agent_server/auth.py` | OBO authentication for Databricks Apps, PAT/OAuth for local dev |
| `agent_server/ingest.py` | Databricks SDK wrapper for fetching Genie Space configs |
| `agent_server/models.py` | Pydantic models: `AgentInput`, `AgentOutput`, `Finding`, `SectionAnalysis`, `ChecklistItem` |
| `agent_server/prompts.py` | LLM prompt templates for checklist evaluation |
| `frontend/src/App.tsx` | Main React app with 4-phase wizard (Input → Ingest → Analysis → Summary) |

### Analysis Approach

Each section is evaluated using:
1. **Programmatic checks** (defined in `checks.py`) - deterministic validations (e.g., count limits, required fields)
2. **LLM checks** (defined in `LLM_CHECKLIST_ITEMS`) - qualitative evaluations (e.g., "descriptions provide clear context")

## Key Patterns

- **MLflow Tracing**: All LLM calls traced with session grouping via `mlflow.start_span()`
- **Hybrid Checklist**: `get_programmatic_checks_for_section()` + `get_llm_checklist_items_for_section()` in `checks.py`
- **Streaming SSE**: `predict_streaming()` yields progress updates; frontend consumes via `/api/analyze/stream`
- **OBO Auth**: In Databricks Apps, uses on-behalf-of tokens; locally uses PAT/OAuth from CLI

## Environment Configuration

Required in `.env.local` (created by quickstart.sh):
```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_CONFIG_PROFILE=DEFAULT   # or DATABRICKS_TOKEN for PAT
MLFLOW_EXPERIMENT_ID=<id>           # MLflow experiment for tracing
LLM_MODEL=databricks-claude-sonnet-4
```

## Technology Stack

- **Backend**: Python 3.11+, FastAPI, Databricks SDK 0.38+, MLflow 3.6+
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Package managers**: `uv` (Python), `npm` (frontend)
- **LLM**: Databricks-hosted Claude Sonnet via serving endpoints

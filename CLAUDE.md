# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GenieRX is an LLM-powered linting tool that analyzes Databricks Genie Space configurations against best practices. It evaluates 10 configuration sections using LLM-based evaluation, provides severity-based findings with remediation guidance, and outputs compliance scores.

**Key design principle**: `docs/checklist-by-schema.md` is the single source of truth for all checklist items. Non-developers can customize checks by editing this markdown file.

## Development Commands

```bash
# Initial setup (creates .env.local, sets up MLflow experiment)
./scripts/quickstart.sh

# Backend server (localhost:8000, serves API + pre-built frontend)
uv run start-server

# Backend with hot-reload (localhost:5001)
uv run uvicorn agent_server.start_server:app --reload --port 5001

# Frontend development (localhost:5173, proxies to backend on 5001)
cd frontend && npm run dev

# Frontend linting and type-check
cd frontend && npm run lint
cd frontend && npm run build  # TypeScript checked during build

# Test agent against a Genie Space (requires running server)
GENIE_SPACE_ID=<id> uv run python test_agent.py --url http://localhost:8000

# Build frontend for production
./scripts/build.sh

# Deploy to Databricks Apps
./scripts/deploy.sh genie-space-analyzer
```

Note: `app.py` at the root is a deprecated Streamlit UI; use `agent_server/` for active development.

## Architecture

```text
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
| `agent_server/checklist_parser.py` | Parses `docs/checklist-by-schema.md` to extract checklist items by section |
| `agent_server/checks.py` | Thin wrapper around checklist_parser for getting items per section |
| `agent_server/auth.py` | OBO authentication for Databricks Apps, PAT/OAuth for local dev |
| `agent_server/ingest.py` | Databricks SDK wrapper for fetching Genie Space configs |
| `agent_server/models.py` | Pydantic models: `AgentInput`, `AgentOutput`, `Finding`, `SectionAnalysis`, `ChecklistItem` |
| `agent_server/prompts.py` | LLM prompt templates for checklist evaluation |
| `frontend/src/App.tsx` | Main React app orchestrating the 4-phase wizard |
| `frontend/src/components/*Phase.tsx` | Phase-specific UI: `InputPhase`, `IngestPhase`, `AnalysisPhase`, `SummaryPhase` |
| `frontend/src/hooks/useTheme.ts` | Theme hook: system preference detection, localStorage persistence, dark class toggle |
| `frontend/src/components/ThemeToggle.tsx` | Sun/Moon icon toggle for light/dark mode |
| `frontend/src/components/ScoreGauge.tsx` | Animated radial SVG progress gauge for compliance scores |

### Analysis Approach

All checklist items are defined in `docs/checklist-by-schema.md` and evaluated by the LLM. The markdown file is parsed at runtime, so users can add/remove/modify checks without changing code.

## Key Patterns

- **Markdown-driven checklist**: `docs/checklist-by-schema.md` is parsed at runtime; all items evaluated by LLM
- **MLflow Tracing**: All LLM calls traced with session grouping via `mlflow.start_span()`
- **Streaming SSE**: `predict_streaming()` yields progress updates; frontend consumes via `/api/analyze/stream`. Events have `status` field: `fetching`, `analyzing` (with `current`/`total`), `complete`, `result`
- **OBO Auth**: In Databricks Apps, uses on-behalf-of tokens; locally uses PAT/OAuth from CLI
- **Section Constants**: The 10 analyzed sections are defined in `SECTIONS` list in `agent.py`

## Environment Configuration

Configuration in `.env.local` (created by quickstart.sh):

```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_CONFIG_PROFILE=DEFAULT   # or DATABRICKS_TOKEN for PAT
MLFLOW_EXPERIMENT_ID=<id>           # Optional: set to enable tracing
LLM_MODEL=databricks-claude-sonnet-4
```

Note: MLflow tracing is optional. Leave `MLFLOW_EXPERIMENT_ID` empty to disable it.

## Technology Stack

- **Backend**: Python 3.11+, FastAPI, Databricks SDK 0.38+, MLflow 3.6+
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4
- **Design System**: Self-hosted fonts (Cabinet Grotesk, General Sans, JetBrains Mono), CSS custom properties for theming, dark mode support
- **Package managers**: `uv` (Python), `npm` (frontend)
- **LLM**: Databricks-hosted Claude Sonnet via serving endpoints

## Frontend Design System

The frontend uses a custom design system with:

- **Theming**: CSS custom properties in `index.css` with `:root` (light) and `.dark` (dark) selectors
- **Fonts**: Self-hosted in `public/fonts/` - Cabinet Grotesk (display), General Sans (body), JetBrains Mono (code)
- **Dark Mode**: Auto-detects `prefers-color-scheme`, persists user override in localStorage (`genierx-theme` key)
- **Animations**: CSS-only animations defined in `index.css` (`@keyframes fadeSlideUp`, `scan`, etc.)

To add/download fonts, get them from:
- Cabinet Grotesk: https://www.fontshare.com/fonts/cabinet-grotesk
- General Sans: https://www.fontshare.com/fonts/general-sans
- JetBrains Mono: https://www.jetbrains.com/lp/mono/

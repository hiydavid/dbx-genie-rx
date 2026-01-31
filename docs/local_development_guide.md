# Local Development Guide

This guide covers local development setup for customizing GenieRx or running it locally before deploying to Databricks Apps.

> For deployment-only instructions, see the main [README](../README.md).

## When to Use This Guide

- Customizing the app code or checklist
- Running locally before deployment
- Frontend development with hot-reload
- Testing changes before pushing to Databricks

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager)
- [Databricks CLI](https://docs.databricks.com/dev-tools/cli/install) (v0.200+)
- Access to a Databricks workspace with Genie Spaces
- Access to a Databricks-hosted LLM endpoint

## Setup

### 1. Clone and Run Quickstart

```bash
# Clone the repository
git clone https://github.com/hiydavid/dbx-genie-rx.git
cd dbx-genie-rx

# Run the quickstart script
./scripts/quickstart.sh
```

The quickstart script will:

1. Check for required tools (uv, Databricks CLI)
2. Set up Databricks authentication (OAuth via CLI)
3. Create an MLflow experiment for tracing (optional)
4. Update `app.yaml` with your experiment ID
5. Create `.env.local` with your configuration
6. Install Python dependencies

### 2. Build the Frontend

```bash
./scripts/build.sh
```

### 3. Run Locally

```bash
uv run start-server
```

Open <http://localhost:8000> in your browser. The server serves both the API and the pre-built frontend.

## Development Commands

### Backend Server

```bash
# Standard server (localhost:8000)
uv run start-server

# With hot-reload (localhost:5001)
uv run uvicorn agent_server.start_server:app --reload --port 5001
```

### Frontend Development with Hot-Reload

For frontend development, run the backend and Vite dev server separately:

```bash
# Terminal 1 - Backend (with hot-reload on port 5001)
uv run uvicorn agent_server.start_server:app --reload --port 5001

# Terminal 2 - Frontend (hot-reload, proxies to backend on 5001)
cd frontend && npm run dev
```

Then open <http://localhost:5173> instead of port 8000.

### Frontend Linting and Type-Check

```bash
cd frontend && npm run lint
cd frontend && npm run build  # TypeScript checked during build
```

## Configuration (`.env.local`)

The quickstart script creates `.env.local` for running the app locally:

```bash
# Databricks workspace URL
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com

# Authentication (OAuth via Databricks CLI - recommended)
DATABRICKS_CONFIG_PROFILE=DEFAULT

# MLflow configuration - logs traces to Databricks (Optional)
MLFLOW_TRACKING_URI=databricks
MLFLOW_REGISTRY_URI=databricks-uc
MLFLOW_EXPERIMENT_ID=123456789

# LLM model for analysis
LLM_MODEL=databricks-claude-sonnet-4-5

# SQL Warehouse for Optimize mode labeling
SQL_WAREHOUSE_ID=abc123def456

# Target directory for creating new Genie Spaces (Optimize mode)
GENIE_TARGET_DIRECTORY=/Workspace/Users/you@company.com/
```

## Deployment

### Deploy to Databricks Apps

```bash
./scripts/deploy.sh genie-space-analyzer
```

Then complete deployment via the Databricks UI.

### Updating the Deployed App

After making code changes:

```bash
# Rebuild frontend and re-sync files
./scripts/build.sh
./scripts/deploy.sh genie-space-analyzer

# Then in Databricks UI: click Deploy on your app
```

## Customizing the Checklist

All checklist items are defined in `docs/checklist-by-schema.md` and evaluated by the LLM at runtime. Non-developers can customize checks by editing this markdown file directly.

## See Also

- [Main README](../README.md) - Databricks deployment instructions
- [Checklist](./checklist-by-schema.md) - Best practices checklist

# 🔍 GenieRX: The Genie Space Analyzer

> ⚠️ **Note:** This project is experimental and under active development.

An LLM-powered linting tool that analyzes Databricks Genie Space configurations against best practices. Get actionable insights and recommendations to improve your Genie Space setup. 

This app was designed to be deployed on Databricks Apps. You can either:
- **Quick deploy**: Clone the repo directly into your Databricks workspace and deploy via the UI (see [UI-Only Deployment](#option-a-ui-only-deployment-quick-start))
- **Local development**: Clone locally, run `quickstart.sh` to setup authentication, then `deploy.sh` to deploy

![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)
![MLflow](https://img.shields.io/badge/MLflow-3.6+-green.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg)

## ✨ Features

<p align="center">
  <img src="docs/genie_analyzer_app.png" alt="Genie Space Analyzer App" width="1000">
</p>

- **Comprehensive Analysis** — Evaluates 11 different sections of your Genie Space configuration
- **Best Practice Validation** — Checks against documented Databricks Genie Space best practices
- **Severity-based Findings** — Categorizes issues as high, medium, or low severity
- **Compliance Scoring** — Provides per-section and overall compliance scores (0-10)
- **Actionable Recommendations** — Each finding includes specific remediation guidance
- **Interactive Wizard UI** — Step-by-step analysis with progress navigation and JSON preview
- **Modern React Frontend** — Beautiful, responsive UI built with React, TypeScript, and Tailwind CSS
- **MLflow Tracing** — Full observability with session-grouped traces logged to Databricks
- **Databricks Apps Deployment** — Deploy with user-based (OBO) authentication

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   React Frontend│────▶│   FastAPI + Agent    │────▶│  Databricks LLM │
│    (frontend/)  │     │   (agent_server/)    │     │  (Claude Sonnet)│
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Databricks API│       │  Best Practices │       │   MLflow Traces │
│ (Genie Space) │       │    (docs/*.md)  │       │   (Databricks)  │
└───────────────┘       └─────────────────┘       └─────────────────┘
```

### Analyzed Sections

The analyzer evaluates the following Genie Space configuration sections:

| Section | Description |
|---------|-------------|
| `config.sample_questions` | Sample questions shown to users |
| `data_sources.tables` | Table configurations and metadata |
| `data_sources.metric_views` | Metric view definitions |
| `instructions.text_instructions` | Natural language instructions |
| `instructions.example_question_sqls` | Example question-SQL pairs |
| `instructions.sql_functions` | Custom SQL function definitions |
| `instructions.join_specs` | Table join specifications |
| `instructions.sql_snippets.filters` | Reusable filter snippets |
| `instructions.sql_snippets.expressions` | Reusable expression snippets |
| `instructions.sql_snippets.measures` | Reusable measure snippets |
| `benchmarks.questions` | Benchmark question configurations |

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager)
- [Databricks CLI](https://docs.databricks.com/dev-tools/cli/install) (v0.200+)
- Access to a Databricks workspace with Genie Spaces
- Access to a Databricks-hosted LLM endpoint (Claude Sonnet recommended)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/dbx-genie-rx.git
cd dbx-genie-rx

# Run the quickstart script
./scripts/quickstart.sh
```

The quickstart script will:
1. ✅ Check for required tools (uv, Databricks CLI)
2. ✅ Set up Databricks authentication (OAuth via CLI)
3. ✅ Create an MLflow experiment for tracing
4. ✅ Update `app.yaml` with your experiment ID
5. ✅ Create `.env.local` with your configuration
6. ✅ Install Python dependencies

### 2. Build the Frontend

```bash
# Build the React frontend
./scripts/build.sh
```

This will:
1. Install Python dependencies
2. Build the React frontend to `frontend/dist`

### 3. Run Locally (Development)

For local development, run the frontend and backend separately:

**Terminal 1 - Backend (FastAPI):**
```bash
uv run start-server
```

**Terminal 2 - Frontend (Vite dev server):**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser. The frontend dev server proxies API requests to the backend.

### 4. Run Locally (Production Mode)

To test the production build locally:

```bash
# Build the frontend first
./scripts/build.sh

# Start the server (serves both API and frontend)
uv run start-server
```

Open http://localhost:5001 in your browser.

### 5. Deploy to Databricks Apps

```bash
# Build and deploy
./scripts/build.sh
./scripts/deploy.sh genie-space-analyzer
```

Then complete deployment via the Databricks UI (see [Deploying to Databricks Apps](#-deploying-to-databricks-apps)).

## ⚙️ Configuration

### Environment Variables

The quickstart script creates `.env.local` with your configuration:

```bash
# Databricks workspace URL
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com

# Authentication (OAuth via Databricks CLI - recommended)
DATABRICKS_CONFIG_PROFILE=DEFAULT

# MLflow configuration - logs traces to Databricks
MLFLOW_TRACKING_URI=databricks
MLFLOW_REGISTRY_URI=databricks-uc
MLFLOW_EXPERIMENT_ID=123456789

# LLM model for analysis
LLM_MODEL=databricks-claude-sonnet-4
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABRICKS_HOST` | Yes (local) | Your Databricks workspace URL |
| `DATABRICKS_CONFIG_PROFILE` | No | Databricks CLI profile (default: DEFAULT) |
| `DATABRICKS_TOKEN` | Optional | PAT token (alternative to OAuth) |
| `MLFLOW_TRACKING_URI` | Yes | Set to `databricks` to log traces to workspace |
| `MLFLOW_EXPERIMENT_ID` | Yes | MLflow experiment ID for tracing |
| `LLM_MODEL` | No | LLM model name (default: `databricks-claude-sonnet-4`) |

> **Note:** When deployed to Databricks Apps, authentication is handled automatically via OAuth (OBO). Environment variables are configured in `app.yaml`.

## 📖 Usage

### React UI

The interactive wizard guides you through 4 phases:

1. **Input** — Enter your Genie Space ID or paste JSON, then click "Fetch" or "Load JSON"
2. **Ingest Preview** — Review the serialized JSON data and metrics before analysis
3. **Section Analysis** — Step through each section, view checklist progress and findings
4. **Summary** — See overall compliance score with expandable section results

**UI Features:**
- 📍 **Sidebar Navigation** — Track progress and jump to completed sections
- 📄 **JSON Preview** — Inspect raw data alongside analysis results
- ✅ **Checklist Progress** — Visual pass/fail indicators for each check
- 📊 **Score Cards** — Color-coded compliance scores
- 📚 **Checklist Reference** — Built-in documentation

### REST API

The backend exposes the following API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/space/fetch` | POST | Fetch a Genie Space by ID |
| `/api/space/parse` | POST | Parse pasted Genie Space JSON |
| `/api/analyze/section` | POST | Analyze a single section |
| `/api/analyze/stream` | POST | Stream analysis progress (SSE) |
| `/api/checklist` | GET | Get checklist documentation |
| `/api/sections` | GET | List all section names |
| `/invocations` | POST | Legacy MLflow agent endpoint |

Example API call:

```bash
curl -X POST http://localhost:5001/api/space/fetch \
  -H "Content-Type: application/json" \
  -d '{"genie_space_id": "your-genie-space-id"}'
```

## 📁 Project Structure

```
dbx-genie-rx/
├── agent_server/           # Core analyzer backend
│   ├── agent.py           # GenieSpaceAnalyzer class & MLflow tracing
│   ├── api.py             # REST API endpoints for React frontend
│   ├── auth.py            # Authentication (PAT local, OBO for Apps)
│   ├── checks.py          # Programmatic and LLM-based checks
│   ├── ingest.py          # Databricks SDK client for Genie Spaces
│   ├── models.py          # Pydantic models (AgentInput, AgentOutput)
│   ├── prompts.py         # LLM prompt templates
│   └── start_server.py    # FastAPI server entry point
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Reusable UI components (Button, Card, etc.)
│   │   │   ├── InputPhase.tsx
│   │   │   ├── IngestPhase.tsx
│   │   │   ├── AnalysisPhase.tsx
│   │   │   ├── SummaryPhase.tsx
│   │   │   └── SidebarNav.tsx
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── quickstart.sh      # Local development setup
│   ├── build.sh           # Build frontend and backend
│   └── deploy.sh          # Databricks Apps deployment
├── docs/                   # Best practices documentation
│   ├── best-practices-by-schema.md
│   └── genie-space-schema.md
├── output/                 # Output files (saved analysis reports)
├── app.py                  # Legacy Streamlit UI (deprecated)
├── app.yaml                # Databricks Apps configuration
├── requirements.txt        # Python dependencies (for Databricks Apps)
└── pyproject.toml          # Project configuration
```

## 🚀 Deploying to Databricks Apps

Deploy the Genie Space Analyzer to Databricks Apps for production use. The app uses **user-based (OBO) authentication**, meaning users can only analyze Genie Spaces they have permission to access.

### Option A: UI-Only Deployment (Quick Start)

If you want to deploy without running any scripts, you can clone the repo directly into your Databricks workspace and deploy via the UI:

1. **Import the repo** into your Databricks workspace:
   - Go to **Workspace > Repos > Add Repo**
   - Enter the Git URL and click **Create Repo**

2. **Create an MLflow Experiment**:
   - Go to **Machine Learning > Experiments > Create Experiment**
   - Name it (e.g., `genie-space-analyzer`)
   - Copy the **Experiment ID** from the URL or experiment details

3. **Update `app.yaml`** with your experiment ID:
   - Open `app.yaml` in the workspace editor
   - Find `MLFLOW_EXPERIMENT_ID` and set its value to your experiment ID:
     ```yaml
     - name: MLFLOW_EXPERIMENT_ID
       value: "YOUR_EXPERIMENT_ID_HERE"
     ```
   - Save the file

4. **Deploy the app**:
   - Go to **Compute > Apps > Create App**
   - Name it (e.g., `genie-space-analyzer`)
   - Click **Deploy** and select your repo folder as the source
   - Click **Deploy** to start

> **Note:** The frontend is pre-built and included in the repo (`frontend/dist/`), so no build step is required.

### Option B: Script-Based Deployment (Recommended)

For local development or when you need to customize the build:

#### Prerequisites

Before deploying, ensure you've:
1. Run the quickstart script: `./scripts/quickstart.sh`
2. Built the frontend: `./scripts/build.sh`

#### Deploy

```bash
./scripts/deploy.sh genie-space-analyzer
```

The deploy script will:
1. ✅ Verify Databricks CLI and authentication
2. ✅ Check/prompt for MLflow experiment ID in `app.yaml`
3. ✅ Sync files to your workspace
4. ✅ Provide UI deployment instructions

Then complete deployment via the Databricks UI:

1. Go to **Compute > Apps** in your workspace
2. Click **Create App** (if first time) and name it `genie-space-analyzer`
3. Click **Deploy** and select the synced folder:
   ```
   /Workspace/Users/<your-email>/apps/genie-space-analyzer
   ```
4. Click **Deploy** to start

### Authentication

| Environment | Auth Method | Description |
|-------------|-------------|-------------|
| Local Development | PAT / OAuth | Uses `DATABRICKS_TOKEN` or CLI OAuth |
| Databricks Apps | OBO (User) | Uses the logged-in user's OAuth token |

**OBO (On-behalf-of) Authentication:**
- Users must authenticate with Databricks to use the app
- Users can only analyze Genie Spaces they have **Manage** permission on
- If a user lacks access, they'll see an appropriate error

### Updating the Deployed App

After making code changes:

```bash
# Rebuild frontend and re-sync files
./scripts/build.sh
./scripts/deploy.sh genie-space-analyzer

# Then in Databricks UI: click Deploy on your app
```

## 📊 MLflow Tracing

All LLM calls and analysis steps are traced with MLflow. Traces are logged to your Databricks workspace and grouped by session.

**View traces:**
1. Go to your Databricks workspace
2. Navigate to **Machine Learning > Experiments**
3. Find your experiment: `/Users/<your-email>/genie-space-analyzer`
4. Click on **Traces** to see all analysis traces

**Filter by session:**
```
metadata.`mlflow.trace.session` = '<session-id>'
```

## 🛠️ Development

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Type checking
npm run build  # TypeScript is checked during build
```

### Backend Development

```bash
# Install dependencies
uv sync

# Start server with hot reload
uv run uvicorn agent_server.start_server:app --reload --port 5001

# Run tests
uv run python test_agent.py
```

## 🛣️ Future Roadmap

- 💾 **Save Summary Report** — Export analysis results to JSON/Markdown files
- 📈 **Historical Comparison** — Track improvements over time
- 🔧 **Auto-fix Suggestions** — Generate fix scripts for common issues

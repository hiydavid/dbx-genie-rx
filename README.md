# (THIS IS A WORK IN PROGRESS AND EXPERIMENTAL) 🔍 GenieRX: The Genie Space Analyzer

An LLM-powered linting tool that analyzes Databricks Genie Space configurations against best practices. Get actionable insights and recommendations to improve your Genie Space setup.

![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)
![MLflow](https://img.shields.io/badge/MLflow-3.6+-green.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.40+-red.svg)

## ✨ Features

- **Comprehensive Analysis** — Evaluates 11 different sections of your Genie Space configuration
- **Best Practice Validation** — Checks against documented Databricks Genie Space best practices
- **Severity-based Findings** — Categorizes issues as high, medium, or low severity
- **Compliance Scoring** — Provides per-section and overall compliance scores (0-100)
- **Actionable Recommendations** — Each finding includes specific remediation guidance
- **Interactive Wizard UI** — Step-by-step analysis with progress navigation and JSON preview
- **Multiple Interfaces** — Use via REST API or interactive Streamlit UI
- **MLflow Tracing** — Full observability with MLflow trace integration

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Streamlit UI  │────▶│   GenieSpaceAnalyzer │────▶│  Databricks LLM │
│   (app/app.py)  │     │   (agent_server/)    │     │  (Claude Sonnet)│
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Databricks API│       │  Best Practices │       │  JSON Output    │
│ (Genie Space) │       │    (docs/*.md)  │       │   (output/)     │
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

- Python 3.13+
- Access to a Databricks workspace with Genie Spaces
- Databricks personal access token with Genie Space read permissions
- Access to a Databricks-hosted LLM endpoint (Claude Sonnet recommended)

## 🚀 Installation

### Using uv (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/dbx-genie-rx.git
cd dbx-genie-rx

# Install dependencies with uv
uv sync
```

### Using pip

```bash
# Clone the repository
git clone https://github.com/your-org/dbx-genie-rx.git
cd dbx-genie-rx

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .
```

## ⚙️ Configuration

Create a `.env.local` file in the project root:

```bash
# Required
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-personal-access-token

# Optional
GENIE_SPACE_ID=your-default-genie-space-id
LLM_MODEL=databricks-claude-sonnet-4
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABRICKS_HOST` | Yes | Your Databricks workspace URL |
| `DATABRICKS_TOKEN` | Yes | Personal access token with Genie Space permissions |
| `GENIE_SPACE_ID` | No | Default Genie Space ID for testing |
| `LLM_MODEL` | No | LLM model name (default: `databricks-claude-sonnet-4`) |

## 📖 Usage

### Streamlit UI

The easiest way to use the analyzer is through the interactive Streamlit wizard:

```bash
cd app
streamlit run app.py
```

Then open http://localhost:8501 in your browser. The wizard guides you through 4 phases:

1. **Input** — Enter your Genie Space ID and click "Fetch Space"
2. **Ingest Preview** — Review the serialized JSON data before analysis begins
3. **Section Analysis** — Step through each section one-by-one, viewing findings grouped by severity
4. **Summary** — See overall compliance score and all findings across sections

**UI Features:**
- **Left Sidebar Navigation** — Track progress and jump to any completed section
- **JSON Preview** — Inspect raw section data alongside analysis results
- **Severity Grouping** — Findings organized by High / Medium / Low severity
- **Save Results** — Export analysis to JSON file

### REST API

Start the MLflow Agent Server:

```bash
# Using uv
uv run start-server

# With hot-reload for development
uv run start-server --reload
```

The server runs at http://localhost:8000. Send analysis requests:

```bash
curl -X POST http://localhost:8000/invocations \
  -H "Content-Type: application/json" \
  -d '{"genie_space_id": "your-genie-space-id"}'
```

## 📁 Project Structure

```
dbx-genie-rx/
├── agent_server/           # Core analyzer backend
│   ├── agent.py           # GenieSpaceAnalyzer class & invoke decorator
│   ├── ingest.py          # Databricks API client for fetching Genie Spaces
│   ├── models.py          # Pydantic models (AgentInput, AgentOutput, Finding)
│   ├── prompts.py         # LLM prompt templates
│   └── start_server.py    # MLflow AgentServer entry point
├── app/                    # Streamlit UI
│   ├── app.py             # Main Streamlit application
│   ├── app.yaml           # Databricks Apps configuration
│   └── requirements.txt   # App-specific dependencies
├── docs/                   # Best practices documentation
│   ├── best-practices-by-schema.md
│   └── genie-space-schema.md
├── output/                 # Analysis results (JSON)
├── pyproject.toml         # Project configuration
└── test_agent.py          # Test script
```

## 📊 Output Format

Analysis results are saved as JSON in the `output/` directory:

```json
{
  "genie_space_id": "aaageniespaceidaaabbbcccdddd",
  "overall_score": 72,
  "trace_id": "abc123...",
  "analyses": [
    {
      "section_name": "config.sample_questions",
      "score": 85,
      "summary": "Sample questions are well-defined but could benefit from more variety.",
      "findings": [
        {
          "category": "suggestion",
          "severity": "low",
          "description": "Consider adding questions that demonstrate aggregation capabilities.",
          "recommendation": "Add 2-3 sample questions showing GROUP BY and aggregate functions.",
          "reference": "Best Practices: Sample Questions"
        }
      ]
    }
  ]
}
```

## 🧪 Testing

```bash
# Test with default Genie Space ID from .env
python test_agent.py

# Test with specific Genie Space ID
python test_agent.py --genie-space-id <your-genie-space-id>
```

## 🔄 Development

### Hot Reload

For development, use the `--reload` flag to automatically restart on code changes:

```bash
uv run start-server --reload
```

### MLflow Tracing

All LLM calls and analysis steps are traced with MLflow. View traces in the MLflow UI or access via the trace ID returned in the response.

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.


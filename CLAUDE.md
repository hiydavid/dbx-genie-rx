# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Genie Space Analyzer - An LLM-powered tool that analyzes Databricks Genie Space configurations against best practices. Uses MLflow AgentServer with a non-conversational agent pattern.

## Commands

```bash
# Start the agent server
uv run start-server

# Start with hot-reload for development
uv run start-server --reload

# Test the agent (requires server running)
python test_agent.py
python test_agent.py --genie-space-id <id>

# Test with curl
curl -X POST http://localhost:8000/invocations \
  -H "Content-Type: application/json" \
  -d '{"genie_space_id": "YOUR_GENIE_SPACE_ID"}'
```

## Architecture

### Non-Conversational Agent Pattern

This project uses MLflow's AgentServer with the `@invoke()` decorator pattern (not `set_model()`):

```python
from mlflow.genai.agent_server import invoke as invoke_decorator

@invoke_decorator()
async def invoke(data: dict) -> dict:
    # Process single request, return single response
    ...
```

### Key Components

- **agent_server/agent.py**: Core analyzer with `GenieSpaceAnalyzer` class. Analyzes Genie space sections sequentially against best practices loaded from `docs/`.
- **agent_server/start_server.py**: Server entry point. Must import agent.py first to register the `@invoke()` function before creating `AgentServer()`.
- **agent_server/ingest.py**: Fetches Genie space configuration from Databricks API via `/api/2.0/genie/spaces/{id}`.
- **agent_server/models.py**: Pydantic models for `AgentInput`, `AgentOutput`, `Finding`, `SectionAnalysis`.
- **docs/best-practices-by-schema.md**: Best practices reference used for LLM analysis prompts.
- **docs/genie-space-schema.md**: Schema reference for Genie space structure.

### Request Flow

1. POST `/invocations` with `{"genie_space_id": "..."}`
2. Fetch Genie space from Databricks API
3. For each section in `SECTIONS` list, call LLM to analyze against relevant best practices
4. Save analysis to `output/analysis_{genie_space_id}.json`
5. Return aggregated analysis with findings, scores, and recommendations

## Environment Variables

Required in `.env.local` or `.env`:
- `DATABRICKS_HOST`: Workspace URL (e.g., `https://xxx.cloud.databricks.com`)
- `DATABRICKS_TOKEN`: Personal access token
- `GENIE_SPACE_ID`: Default Genie space ID for testing
- `LLM_MODEL`: Model name (default: `databricks-claude-sonnet-4`)

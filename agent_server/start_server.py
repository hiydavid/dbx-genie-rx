import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local", override=True)
load_dotenv()  # Also load from .env as fallback

import agent_server.agent

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mlflow.genai.agent_server import (
    AgentServer,
    setup_mlflow_git_based_version_tracking,
)
from starlette.responses import StreamingResponse

from agent_server.agent import get_analyzer, save_analysis_output
from agent_server.api import router as api_router
from agent_server.models import AgentInput

agent_server = AgentServer()
# Define the app as a module level variable to enable multiple workers
app = agent_server.app  # noqa: F841
setup_mlflow_git_based_version_tracking()

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router)

# Serve static files from React build (production)
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount static assets
    if (FRONTEND_DIST / "assets").exists():
        app.mount(
            "/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets"
        )

    # Serve React SPA for root route
    @app.get("/")
    async def serve_root():
        """Serve React SPA for root route."""
        return FileResponse(FRONTEND_DIST / "index.html")

    # Serve index.html for all non-API routes (SPA client-side routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve React SPA for all non-API routes."""
        return FileResponse(FRONTEND_DIST / "index.html")

else:
    # Frontend not deployed - provide helpful debug info at root only
    @app.get("/")
    async def serve_root_debug():
        """Debug endpoint when frontend is missing."""
        return {
            "error": "Frontend not built or not deployed",
            "expected_path": str(FRONTEND_DIST),
            "hint": "Ensure frontend/dist/ is included in deployment (check .databricksignore)",
        }


# Add streaming endpoint for progress updates (legacy)
@app.post("/invocations/stream")
async def invoke_stream(data: dict):
    """Streaming invocation endpoint that sends progress updates."""

    def generate():
        analyzer = get_analyzer()
        input_obj = AgentInput(**data)
        gen = analyzer.predict_streaming(input_obj)

        result = None
        try:
            while True:
                progress = next(gen)
                yield f"data: {json.dumps(progress)}\n\n"
        except StopIteration as e:
            result = e.value

        if result:
            save_analysis_output(result)
            yield f"data: {json.dumps({'status': 'result', 'data': result.model_dump()})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


def main():
    """Start the agent server."""
    # Use import string to support multiple workers
    agent_server.run(app_import_string="agent_server.start_server:app")


if __name__ == "__main__":
    main()

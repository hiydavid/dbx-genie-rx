import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local", override=True)
load_dotenv()  # Also load from .env as fallback

# Configure logging early
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _validate_mlflow_experiment() -> bool:
    """Validate that MLFLOW_EXPERIMENT_ID exists in the tracking server.
    
    If validation fails, clears the environment variable to prevent AgentServer
    from failing during initialization.
    
    Returns:
        True if experiment is valid or validation was skipped, False if invalid.
    """
    experiment_id = os.environ.get("MLFLOW_EXPERIMENT_ID", "").strip()
    
    if not experiment_id:
        logger.warning(
            "MLFLOW_EXPERIMENT_ID is not set. MLflow tracing will be disabled. "
            "Set MLFLOW_EXPERIMENT_ID in app.yaml to enable trace logging."
        )
        return False
    
    # Try to validate the experiment exists
    try:
        import mlflow
        
        # Set tracking URI if specified
        tracking_uri = os.environ.get("MLFLOW_TRACKING_URI")
        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)
        
        # Try to get the experiment - this will fail if it doesn't exist
        experiment = mlflow.get_experiment(experiment_id)
        if experiment is None:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        logger.info(f"MLflow experiment validated: {experiment.name} (ID: {experiment_id})")
        return True
        
    except Exception as e:
        logger.warning(
            f"MLflow experiment ID '{experiment_id}' is not valid: {e}. "
            "MLflow tracing will be disabled. "
            "Create an experiment in your workspace and update MLFLOW_EXPERIMENT_ID in app.yaml."
        )
        # Clear the environment variable to prevent AgentServer from failing
        os.environ.pop("MLFLOW_EXPERIMENT_ID", None)
        return False


# Validate MLflow experiment before importing agent module (which enables tracing)
_mlflow_configured = _validate_mlflow_experiment()

import agent_server.agent

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mlflow.genai.agent_server import (
    AgentServer,
    setup_mlflow_git_based_version_tracking,
)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

from agent_server.agent import get_analyzer, save_analysis_output
from agent_server.api import router as api_router
from agent_server.auth import set_user_token
from agent_server.models import AgentInput


class OBOAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to extract OBO user token from Databricks Apps requests.
    
    When Databricks Apps is configured with user authorization (OBO),
    the user's access token is passed via the 'x-forwarded-access-token' header.
    This middleware extracts that token and makes it available for API calls.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Extract OBO token from Databricks Apps header
        user_token = request.headers.get("x-forwarded-access-token")
        
        if user_token:
            # Log once that OBO token was found
            if not getattr(OBOAuthMiddleware, '_logged', False):
                logger.info(f"OBO token found in request header ({len(user_token)} chars)")
                OBOAuthMiddleware._logged = True
            
            # Set the token in context for this request
            set_user_token(user_token)
        
        response = await call_next(request)
        
        # Clear token after request
        set_user_token(None)
        
        return response


agent_server = AgentServer()
# Define the app as a module level variable to enable multiple workers
app = agent_server.app  # noqa: F841

# Set up MLflow git-based version tracking (graceful fallback if not configured)
if _mlflow_configured:
    try:
        setup_mlflow_git_based_version_tracking()
    except Exception as e:
        logger.warning(f"MLflow git-based version tracking not configured: {e}")

# Add OBO authentication middleware (must be added before other middleware)
app.add_middleware(OBOAuthMiddleware)

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

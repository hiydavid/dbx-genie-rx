"""
REST API endpoints for the Genie Space Analyzer.

Provides endpoints for the React frontend to fetch spaces, analyze sections,
and stream analysis progress.
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent_server.agent import GenieSpaceAnalyzer, SECTIONS, get_analyzer
from agent_server.ingest import get_serialized_space
from agent_server.models import AgentInput, SectionAnalysis

router = APIRouter(prefix="/api")


# Request/Response models
class FetchSpaceRequest(BaseModel):
    """Request to fetch a Genie Space."""
    genie_space_id: str


class FetchSpaceResponse(BaseModel):
    """Response containing the fetched Genie Space data."""
    genie_space_id: str
    space_data: dict
    sections: list[dict]  # List of {name, data, has_data}


class ParseJsonRequest(BaseModel):
    """Request to parse pasted JSON."""
    json_content: str


class AnalyzeSectionRequest(BaseModel):
    """Request to analyze a single section."""
    section_name: str
    section_data: dict | list | None
    full_space: dict


class StreamAnalysisRequest(BaseModel):
    """Request for streaming analysis."""
    genie_space_id: str


@router.post("/space/fetch", response_model=FetchSpaceResponse)
async def fetch_space(request: FetchSpaceRequest):
    """Fetch and parse a Genie Space by ID.
    
    Returns the space data and list of sections with their data.
    """
    try:
        space_data = get_serialized_space(request.genie_space_id)
        analyzer = get_analyzer()
        all_sections = analyzer.get_all_sections(space_data)
        
        sections = [
            {
                "name": name,
                "data": data,
                "has_data": data is not None
            }
            for name, data in all_sections
        ]
        
        return FetchSpaceResponse(
            genie_space_id=request.genie_space_id,
            space_data=space_data,
            sections=sections
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/space/parse", response_model=FetchSpaceResponse)
async def parse_space_json(request: ParseJsonRequest):
    """Parse pasted Genie Space JSON.
    
    Accepts the raw API response from GET /api/2.0/genie/spaces/{id}?include_serialized_space=true
    """
    import ast
    from datetime import datetime
    
    try:
        # Try JSON first, then fall back to Python dict syntax
        try:
            raw_response = json.loads(request.json_content)
        except json.JSONDecodeError:
            raw_response = ast.literal_eval(request.json_content)
        
        # Extract and parse the serialized_space field
        if "serialized_space" not in raw_response:
            raise HTTPException(
                status_code=400,
                detail="Invalid input: missing 'serialized_space' field"
            )
        
        serialized = raw_response["serialized_space"]
        if isinstance(serialized, str):
            space_data = json.loads(serialized)
        else:
            space_data = serialized
        
        # Generate placeholder ID
        genie_space_id = f"pasted-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        analyzer = get_analyzer()
        all_sections = analyzer.get_all_sections(space_data)
        
        sections = [
            {
                "name": name,
                "data": data,
                "has_data": data is not None
            }
            for name, data in all_sections
        ]
        
        return FetchSpaceResponse(
            genie_space_id=genie_space_id,
            space_data=space_data,
            sections=sections
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")


@router.post("/analyze/section")
async def analyze_section(request: AnalyzeSectionRequest) -> SectionAnalysis:
    """Analyze a single section of the Genie Space."""
    try:
        analyzer = get_analyzer()
        analysis = analyzer.analyze_section(
            request.section_name,
            request.section_data,
            full_space=request.full_space
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/stream")
async def stream_analysis(request: StreamAnalysisRequest):
    """Stream analysis progress for all sections.
    
    Returns Server-Sent Events with progress updates and final results.
    """
    def generate():
        analyzer = get_analyzer()
        input_obj = AgentInput(genie_space_id=request.genie_space_id)
        gen = analyzer.predict_streaming(input_obj)
        
        result = None
        try:
            while True:
                progress = next(gen)
                yield f"data: {json.dumps(progress)}\n\n"
        except StopIteration as e:
            result = e.value
        
        if result:
            from agent_server.agent import save_analysis_output
            save_analysis_output(result)
            yield f"data: {json.dumps({'status': 'result', 'data': result.model_dump()})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/checklist")
async def get_checklist():
    """Get the checklist markdown documentation."""
    docs_path = Path(__file__).parent.parent / "docs" / "checklist-by-schema.md"
    try:
        content = docs_path.read_text()
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Checklist documentation not found")


@router.get("/sections")
async def get_sections():
    """Get the list of all section names."""
    return {"sections": SECTIONS}


@router.get("/debug/auth")
async def debug_auth(request: Request):
    """Debug endpoint to check authentication status.
    
    Returns information about the current authentication context.
    Useful for troubleshooting OBO and API access issues.
    """
    import os
    from agent_server.auth import get_workspace_client, is_running_on_databricks_apps, get_user_token
    
    # Check for OBO token in request header
    obo_token = request.headers.get("x-forwarded-access-token")
    obo_token_from_context = get_user_token()
    
    try:
        client = get_workspace_client()
        
        # Try to get current user to verify auth is working
        try:
            current_user = client.current_user.me()
            user_info = {
                "user_name": current_user.user_name,
                "display_name": current_user.display_name,
            }
        except Exception as e:
            user_info = {"error": str(e)}
        
        return {
            "running_on_databricks_apps": is_running_on_databricks_apps(),
            "obo_token_in_header": f"[{len(obo_token)} chars]" if obo_token else "[not present]",
            "obo_token_in_context": f"[{len(obo_token_from_context)} chars]" if obo_token_from_context else "[not set]",
            "host": client.config.host,
            "auth_type": client.config.auth_type,
            "current_user": user_info,
            "env_vars": {
                "DATABRICKS_HOST": os.environ.get("DATABRICKS_HOST", "[not set]"),
                "DATABRICKS_APP_PORT": os.environ.get("DATABRICKS_APP_PORT", "[not set]"),
                "DATABRICKS_TOKEN": "[set]" if os.environ.get("DATABRICKS_TOKEN") else "[not set]",
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "running_on_databricks_apps": is_running_on_databricks_apps(),
            "obo_token_in_header": f"[{len(obo_token)} chars]" if obo_token else "[not present]",
        }


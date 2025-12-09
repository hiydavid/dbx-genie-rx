"""
Genie Space data ingestion utilities.

Fetches and parses Genie Space configurations from the Databricks API.
Supports both local development (PAT) and Databricks Apps (OBO) authentication.
"""

import json
import os

from dotenv import load_dotenv

from agent_server.auth import get_workspace_client

load_dotenv()


def get_genie_space(
    genie_space_id: str | None = None,
) -> dict:
    """Fetch and parse a Genie space's serialized configuration.

    Uses the Databricks SDK's API client which automatically handles
    OBO authentication when running on Databricks Apps, ensuring that
    the user's permissions are checked. Users without access to the Genie
    Space will receive a 403/404 error.

    Args:
        genie_space_id: The Genie space ID (defaults to GENIE_SPACE_ID env var)

    Returns:
        Parsed serialized space configuration as a dictionary

    Raises:
        Exception: If the API request fails (e.g., 403 for no access)
    """
    genie_space_id = genie_space_id or os.environ.get("GENIE_SPACE_ID")
    if not genie_space_id:
        raise ValueError("genie_space_id is required")

    # Use SDK's API client - handles OBO auth automatically
    client = get_workspace_client()
    
    response = client.api_client.do(
        method="GET",
        path=f"/api/2.0/genie/spaces/{genie_space_id}",
        query={"include_serialized_space": "true"},
    )

    return response


def get_serialized_space(genie_space_id: str | None = None) -> dict:
    """Fetch a Genie space and return the parsed serialized space.

    Args:
        genie_space_id: The Genie space ID (defaults to GENIE_SPACE_ID env var)

    Returns:
        Parsed serialized space configuration as a dictionary
    """
    data = get_genie_space(genie_space_id=genie_space_id)
    return json.loads(data["serialized_space"])

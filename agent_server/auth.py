"""
Authentication utilities for Databricks Apps deployment.

Provides OBO (On-behalf-of) authentication when running on Databricks Apps,
and falls back to PAT token authentication for local development.
"""

import os

from databricks.sdk import WorkspaceClient


def is_running_on_databricks_apps() -> bool:
    """Check if running on Databricks Apps (vs local development)."""
    # DATABRICKS_APP_PORT is set when running on Databricks Apps
    return os.environ.get("DATABRICKS_APP_PORT") is not None


def get_workspace_client() -> WorkspaceClient:
    """Get a Databricks WorkspaceClient with appropriate authentication.

    When running on Databricks Apps:
        Uses the default SDK authentication which automatically handles
        OBO (On-behalf-of) user authentication via request headers.
        NOTE: Do NOT cache this client - OBO requires fresh auth per request.

    When running locally:
        Uses PAT token from DATABRICKS_TOKEN environment variable.

    Returns:
        WorkspaceClient configured for the current environment
    """
    if is_running_on_databricks_apps():
        # On Databricks Apps, the SDK automatically uses OBO auth
        # when initialized without explicit credentials
        # Must create a new client for each request to get fresh user context
        return WorkspaceClient()
    else:
        # Local development - use PAT token from environment
        return WorkspaceClient(
            host=os.environ.get("DATABRICKS_HOST"),
            token=os.environ.get("DATABRICKS_TOKEN"),
        )


def get_databricks_host() -> str:
    """Get the Databricks workspace host URL.

    Returns:
        The Databricks host URL (without trailing slash)
    """
    if is_running_on_databricks_apps():
        client = get_workspace_client()
        host = client.config.host
        return host.rstrip("/") if host else ""
    else:
        host = os.environ.get("DATABRICKS_HOST", "")
        return host.rstrip("/") if host else ""


def get_llm_api_key() -> str:
    """Get the API key for LLM serving endpoints.

    When running on Databricks Apps:
        Uses a fresh token from the SDK for each request (OBO).

    When running locally:
        Uses PAT token from environment.

    Returns:
        API key/token for authenticating with serving endpoints
    """
    if is_running_on_databricks_apps():
        # Get fresh client and extract token for this request
        client = get_workspace_client()
        # Access the token from the SDK config
        return client.config.token or ""
    else:
        return os.environ.get("DATABRICKS_TOKEN", "")

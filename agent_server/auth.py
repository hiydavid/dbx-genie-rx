"""
Authentication utilities for Databricks Apps deployment.

Provides OBO (On-behalf-of) authentication when running on Databricks Apps,
and falls back to PAT token authentication for local development.
"""

import logging
import os

from databricks.sdk import WorkspaceClient

logger = logging.getLogger(__name__)

# Track if we've logged auth info
_auth_logged = False


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
    global _auth_logged

    # Let the SDK auto-detect the environment and authentication
    # On Databricks (Apps, Notebooks, Jobs), it will use the appropriate auth
    # Locally, it will use DATABRICKS_HOST + DATABRICKS_TOKEN or CLI profile
    client = WorkspaceClient()

    # Log auth info for debugging (first time only)
    if not _auth_logged:
        logger.info("=== Databricks SDK Authentication ===")
        logger.info(f"  Host: {client.config.host}")
        logger.info(f"  Auth type: {client.config.auth_type}")
        logger.info(f"  Running on Databricks Apps: {is_running_on_databricks_apps()}")

        # Log relevant env vars (without exposing secrets)
        env_vars = [
            "DATABRICKS_HOST",
            "DATABRICKS_APP_PORT",
            "DATABRICKS_RUNTIME_VERSION",
            "DATABRICKS_TOKEN",  # Just check if set, don't log value
        ]
        for var in env_vars:
            val = os.environ.get(var)
            if val:
                # Mask tokens
                if "TOKEN" in var:
                    logger.info(f"  {var}: [SET - {len(val)} chars]")
                else:
                    logger.info(f"  {var}: {val}")

        _auth_logged = True

    return client


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

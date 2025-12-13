"""
Authentication utilities for Databricks Apps deployment.

Provides OBO (On-behalf-of) authentication when running on Databricks Apps,
and falls back to PAT token authentication for local development.
"""

import logging
import os
from contextvars import ContextVar
from typing import Optional

from databricks.sdk import WorkspaceClient

logger = logging.getLogger(__name__)

# Track if we've logged auth info
_auth_logged = False

# Context variable to store the user's OBO token from the request
_user_token: ContextVar[Optional[str]] = ContextVar("user_token", default=None)


def is_running_on_databricks_apps() -> bool:
    """Check if running on Databricks Apps (vs local development)."""
    # DATABRICKS_APP_PORT is set when running on Databricks Apps
    return os.environ.get("DATABRICKS_APP_PORT") is not None


def set_user_token(token: Optional[str]) -> None:
    """Set the user's OBO token for the current request context.

    This should be called from FastAPI middleware to pass the
    x-forwarded-access-token header value.
    """
    _user_token.set(token)


def get_user_token() -> Optional[str]:
    """Get the user's OBO token from the current request context."""
    return _user_token.get()


def get_workspace_client(user_token: Optional[str] = None) -> WorkspaceClient:
    """Get a Databricks WorkspaceClient with appropriate authentication.

    When running on Databricks Apps with OBO:
        Uses the user's token from x-forwarded-access-token header.
        This token should be passed via set_user_token() or the user_token param.

    When running on Databricks Apps without OBO token:
        Falls back to the app's service principal (oauth-m2m).

    When running locally:
        Uses PAT token from DATABRICKS_TOKEN environment variable or CLI profile.

    Args:
        user_token: Optional user token to use for OBO auth. If not provided,
                   will try to get from context variable (set by middleware).

    Returns:
        WorkspaceClient configured for the current environment
    """
    global _auth_logged

    # Try to get user token from parameter or context
    token = user_token or get_user_token()

    if is_running_on_databricks_apps() and token:
        # Use OBO: user's token from x-forwarded-access-token header
        host = os.environ.get("DATABRICKS_HOST")
        client = WorkspaceClient(host=host, token=token)

        if not _auth_logged:
            logger.info("=== Databricks SDK Authentication (OBO) ===")
            logger.info(f"  Host: {host}")
            logger.info(f"  Auth type: OBO (user token)")
            logger.info(f"  Token length: {len(token)} chars")
            _auth_logged = True
    else:
        # Let SDK auto-detect (service principal on Apps, CLI/PAT locally)
        client = WorkspaceClient()

        if not _auth_logged:
            logger.info("=== Databricks SDK Authentication ===")
            logger.info(f"  Host: {client.config.host}")
            logger.info(f"  Auth type: {client.config.auth_type}")
            logger.info(
                f"  Running on Databricks Apps: {is_running_on_databricks_apps()}"
            )
            if is_running_on_databricks_apps():
                logger.warning("  OBO token not available - using service principal")

            # Log relevant env vars (without exposing secrets)
            env_vars = [
                "DATABRICKS_HOST",
                "DATABRICKS_APP_PORT",
                "DATABRICKS_RUNTIME_VERSION",
                "DATABRICKS_TOKEN",
            ]
            for var in env_vars:
                val = os.environ.get(var)
                if val:
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

import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()


def get_genie_space(
    token: str | None = None,
    base_url: str | None = None,
    genie_space_id: str | None = None,
) -> dict:
    """Fetch and parse a Genie space's serialized configuration.

    Args:
        token: Databricks personal access token (defaults to DATABRICKS_TOKEN env var)
        base_url: Workspace URL (defaults to DATABRICKS_HOST env var)
        genie_space_id: The Genie space ID (defaults to GENIE_SPACE_ID env var)

    Returns:
        Parsed serialized space configuration as a dictionary
    """
    token = token or os.environ["DATABRICKS_TOKEN"]
    base_url = base_url or os.environ["DATABRICKS_HOST"]
    genie_space_id = genie_space_id or os.environ["GENIE_SPACE_ID"]

    endpoint = f"/api/2.0/genie/spaces/{genie_space_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    params = {"include_serialized_space": "true"}

    response = requests.get(f"{base_url}{endpoint}", headers=headers, params=params)
    response.raise_for_status()

    return response.json()


def save_genie_space(output_dir: str = "output", filename: str | None = None) -> str:
    """Fetch a Genie space and save it to a local JSON file.

    Args:
        output_dir: Directory to save the JSON file (created if doesn't exist)
        filename: Output filename (defaults to {genie_space_id}.json)

    Returns:
        Path to the saved JSON file
    """
    data = get_genie_space()
    serialized_space = json.loads(data["serialized_space"])
    genie_space_id = os.environ["GENIE_SPACE_ID"]

    os.makedirs(output_dir, exist_ok=True)

    filename = filename or f"{genie_space_id}.json"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w") as f:
        json.dump(serialized_space, f, indent=2)

    return filepath


save_genie_space("data", "serialized_space.json")

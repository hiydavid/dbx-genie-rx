#!/usr/bin/env python
"""Test script for the Genie Space Analyzer agent."""

import argparse
import json
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()


def test_agent(url: str = "http://localhost:8000", genie_space_id: str | None = None):
    """Test the agent server with a Genie space ID.

    Args:
        url: Base URL of the agent server
        genie_space_id: The Genie space ID to analyze (defaults to GENIE_SPACE_ID env var)
    """
    genie_space_id = genie_space_id or os.environ.get("GENIE_SPACE_ID")

    if not genie_space_id:
        print(
            "Error: GENIE_SPACE_ID environment variable not set and --genie-space-id not provided"
        )
        sys.exit(1)

    payload = {"genie_space_id": genie_space_id}

    print(f"Testing agent at {url}/invocations/stream")
    print(f"Genie Space ID: {genie_space_id}")
    print("-" * 50)

    try:
        # Use streaming endpoint for progress updates
        with requests.post(
            f"{url}/invocations/stream",
            json=payload,
            headers={"Content-Type": "application/json"},
            stream=True,
        ) as response:
            response.raise_for_status()

            result = None
            for line in response.iter_lines():
                if line:
                    line = line.decode("utf-8")
                    if line.startswith("data: "):
                        data = json.loads(line[6:])
                        status = data.get("status")

                        if status == "fetching":
                            print(f"⏳ {data['message']}")
                        elif status == "analyzing":
                            print(
                                f"🔍 [{data['current']}/{data['total']}] {data['message']}"
                            )
                        elif status == "complete":
                            print(f"✅ {data['message']}")
                        elif status == "result":
                            result = data["data"]

            if result:
                print("\n" + json.dumps(result, indent=2))
                _print_summary(result)

    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {url}")
        print("Make sure the server is running with: uv run start-server")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)


def _print_summary(output: dict):
    """Print a summary of the analysis results."""
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Overall Score: {output.get('overall_score', 'N/A')}/100")
    print(f"Sections Analyzed: {len(output.get('analyses', []))}")
    print(f"Trace ID: {output.get('trace_id', 'N/A')}")

    for analysis in output.get("analyses", []):
        finding_count = len(analysis.get("findings", []))
        print(
            f"\n  {analysis['section_name']}: {analysis['score']}/100 ({finding_count} findings)"
        )


def check_health(url: str = "http://localhost:8000"):
    """Check if the agent server is healthy."""
    try:
        response = requests.get(f"{url}/health")
        response.raise_for_status()
        print(f"Server at {url} is healthy")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Health check failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Test the Genie Space Analyzer agent")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Base URL of the agent server (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--genie-space-id",
        help="Genie Space ID to analyze (defaults to GENIE_SPACE_ID env var)",
    )
    parser.add_argument(
        "--check-health",
        action="store_true",
        help="Only check server health",
    )

    args = parser.parse_args()

    if args.check_health:
        sys.exit(0 if check_health(args.url) else 1)

    test_agent(args.url, args.genie_space_id)


if __name__ == "__main__":
    main()

import json

from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local", override=True)
load_dotenv()  # Also load from .env as fallback

import agent_server.agent

from mlflow.genai.agent_server import (
    AgentServer,
    setup_mlflow_git_based_version_tracking,
)
from starlette.responses import StreamingResponse

from agent_server.agent import get_analyzer, save_analysis_output
from agent_server.models import AgentInput

agent_server = AgentServer()
# Define the app as a module level variable to enable multiple workers
app = agent_server.app  # noqa: F841
setup_mlflow_git_based_version_tracking()


# Add streaming endpoint for progress updates
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

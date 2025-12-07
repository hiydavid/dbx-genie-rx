from dotenv import load_dotenv

# Load environment variables before importing agent
load_dotenv(dotenv_path=".env.local", override=True)
load_dotenv()  # Also load from .env as fallback

# Import the agent FIRST to register the predict function with mlflow.models.set_model()
import agent_server.agent  # noqa: E402, F401

from mlflow.genai.agent_server import AgentServer, setup_mlflow_git_based_version_tracking

agent_server = AgentServer()
# Define the app as a module level variable to enable multiple workers
app = agent_server.app  # noqa: F841
setup_mlflow_git_based_version_tracking()


def main():
    """Start the agent server."""
    # Use import string to support multiple workers
    agent_server.run(app_import_string="agent_server.start_server:app")


if __name__ == "__main__":
    main()

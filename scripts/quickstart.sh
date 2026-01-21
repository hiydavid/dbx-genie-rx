#!/bin/bash
# =============================================================================
# Quickstart Script for Local Development
# =============================================================================
# This script sets up your local environment for developing the Genie Space
# Analyzer. It will:
#   1. Check for required tools (uv, databricks CLI)
#   2. Set up Databricks authentication
#   3. Create an MLflow experiment
#   4. Create .env.local from template
#
# Usage: ./scripts/quickstart.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "=========================================="
echo "  Genie Space Analyzer - Local Setup"
echo "=========================================="
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check for uv
# -----------------------------------------------------------------------------
info "Checking for uv (Python package manager)..."
if command -v uv &> /dev/null; then
    success "uv is installed ($(uv --version))"
else
    error "uv is not installed. Please install it first:
    
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    See: https://docs.astral.sh/uv/getting-started/installation/"
fi

# -----------------------------------------------------------------------------
# Step 2: Check for Databricks CLI
# -----------------------------------------------------------------------------
info "Checking for Databricks CLI..."
if command -v databricks &> /dev/null; then
    success "Databricks CLI is installed ($(databricks --version 2>&1 | head -n1))"
else
    error "Databricks CLI is not installed. Please install it first:
    
    # macOS
    brew tap databricks/tap
    brew install databricks
    
    # Or via pip
    pip install databricks-cli
    
    See: https://docs.databricks.com/dev-tools/cli/install"
fi

# -----------------------------------------------------------------------------
# Step 3: Set up Databricks authentication
# -----------------------------------------------------------------------------
info "Checking Databricks authentication..."

# Try to get current user to verify auth
if databricks current-user me &> /dev/null; then
    DATABRICKS_USER=$(databricks current-user me 2>/dev/null | jq -r '.userName // .user_name // "unknown"')
    success "Authenticated as: $DATABRICKS_USER"
else
    warn "Not authenticated with Databricks. Starting authentication..."
    echo ""
    echo "Please log in to your Databricks workspace:"
    databricks auth login
    
    if databricks current-user me &> /dev/null; then
        DATABRICKS_USER=$(databricks current-user me | jq -r '.userName // .user_name')
        success "Successfully authenticated as: $DATABRICKS_USER"
    else
        error "Authentication failed. Please try again."
    fi
fi

# Get Databricks host from JSON output
DATABRICKS_HOST=$(databricks auth env 2>/dev/null | jq -r '.env.DATABRICKS_HOST // empty' || echo "")
if [ -z "$DATABRICKS_HOST" ]; then
    DATABRICKS_HOST=$(databricks auth describe 2>/dev/null | grep -i "host" | awk '{print $NF}' | tr -d '"' || echo "")
fi

# -----------------------------------------------------------------------------
# Step 4: Create MLflow experiment
# -----------------------------------------------------------------------------
info "Setting up MLflow experiment..."

EXPERIMENT_NAME="/Users/$DATABRICKS_USER/genie-space-analyzer"
EXPERIMENT_ID=""

# Check if experiment already exists
# The CLI returns nested JSON: {"experiment": {"experiment_id": "...", ...}}
EXISTING_EXPERIMENT=$(databricks experiments get-by-name "$EXPERIMENT_NAME" -o json 2>/dev/null || echo "")

# Try both JSON paths: .experiment.experiment_id (nested) and .experiment_id (flat)
if [ -n "$EXISTING_EXPERIMENT" ]; then
    EXPERIMENT_ID=$(echo "$EXISTING_EXPERIMENT" | jq -r '.experiment.experiment_id // .experiment_id // empty' 2>/dev/null || echo "")
fi

if [ -n "$EXPERIMENT_ID" ]; then
    success "MLflow experiment already exists: $EXPERIMENT_NAME (ID: $EXPERIMENT_ID)"
else
    info "Creating new MLflow experiment: $EXPERIMENT_NAME"
    CREATE_RESULT=$(databricks experiments create-experiment "$EXPERIMENT_NAME" -o json 2>&1 || true)
    
    # Try both JSON paths for the created experiment
    EXPERIMENT_ID=$(echo "$CREATE_RESULT" | jq -r '.experiment.experiment_id // .experiment_id // empty' 2>/dev/null || echo "")
    
    if [ -n "$EXPERIMENT_ID" ]; then
        success "Created MLflow experiment: $EXPERIMENT_NAME (ID: $EXPERIMENT_ID)"
    else
        warn "Could not create MLflow experiment automatically."
        echo "  Please create it manually in your Databricks workspace."
        echo "  Path: $EXPERIMENT_NAME"
        echo "  Error: $CREATE_RESULT"
        echo ""
        echo "  You can try getting the existing experiment ID with:"
        echo "    databricks experiments get-by-name \"$EXPERIMENT_NAME\" -o json"
    fi
fi

# Update app.yaml with the experiment ID if we have one
if [ -n "$EXPERIMENT_ID" ]; then
    info "Updating app.yaml with experiment ID..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed requires empty string for -i
        sed -i '' "/MLFLOW_EXPERIMENT_ID/{n;s/value: *\"[^\"]*\"/value: \"$EXPERIMENT_ID\"/;}" app.yaml
    else
        sed -i "/MLFLOW_EXPERIMENT_ID/{n;s/value: *\"[^\"]*\"/value: \"$EXPERIMENT_ID\"/;}" app.yaml
    fi
    success "Updated app.yaml with MLFLOW_EXPERIMENT_ID: $EXPERIMENT_ID"
fi

# -----------------------------------------------------------------------------
# Step 5: Create .env.local file
# -----------------------------------------------------------------------------
info "Setting up environment file..."

ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    warn ".env.local already exists. Backing up to .env.local.bak"
    cp "$ENV_FILE" "$ENV_FILE.bak"
fi

# Get host from Databricks CLI config
if [ -n "$DATABRICKS_HOST" ]; then
    HOST_LINE="DATABRICKS_HOST=$DATABRICKS_HOST"
else
    HOST_LINE="DATABRICKS_HOST=https://your-workspace.cloud.databricks.com  # Update this!"
fi

cat > "$ENV_FILE" << EOF
# Local development environment
# Generated by quickstart.sh on $(date)

# Databricks workspace URL
$HOST_LINE

# Authentication: Use OAuth via Databricks CLI (recommended)
# Run: databricks auth login
DATABRICKS_CONFIG_PROFILE=DEFAULT

# Or use a Personal Access Token (uncomment and fill in):
# DATABRICKS_TOKEN=dapi_your_token_here

# MLflow configuration - log to Databricks workspace
MLFLOW_TRACKING_URI=databricks
MLFLOW_REGISTRY_URI=databricks-uc
MLFLOW_EXPERIMENT_ID=$EXPERIMENT_ID

# LLM model for analysis
LLM_MODEL=databricks-claude-sonnet-4
EOF

success "Created $ENV_FILE"

# -----------------------------------------------------------------------------
# Step 6: Install dependencies
# -----------------------------------------------------------------------------
info "Installing Python dependencies..."
uv sync
success "Dependencies installed"

# -----------------------------------------------------------------------------
# Done!
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Review and update .env.local if needed"
echo ""
echo "  2. Start the local server:"
echo -e "     ${GREEN}uv run start-server${NC}"
echo ""
echo "  3. To deploy to Databricks Apps:"
echo -e "     ${GREEN}./scripts/deploy.sh <app-name>${NC}"
echo ""


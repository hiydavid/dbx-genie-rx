#!/bin/bash
# =============================================================================
# Deploy Script for Databricks Apps
# =============================================================================
# This script prepares and syncs the Genie Space Analyzer to Databricks.
# Based on: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/deploy
#
# It will:
#   1. Verify prerequisites (Databricks CLI, authentication, app.yaml)
#   2. Sync files to the workspace
#   3. Provide instructions for deploying via UI
#
# Usage: ./scripts/deploy.sh <app-name>
# Example: ./scripts/deploy.sh genie-space-analyzer
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
echo "  Genie Space Analyzer - Sync to Databricks"
echo "=========================================="
echo ""

# -----------------------------------------------------------------------------
# Parse arguments
# -----------------------------------------------------------------------------
APP_NAME="${1:-genie-space-analyzer}"

# -----------------------------------------------------------------------------
# Step 1: Check for Databricks CLI
# -----------------------------------------------------------------------------
info "Checking for Databricks CLI..."
if command -v databricks &> /dev/null; then
    success "Databricks CLI is installed"
else
    error "Databricks CLI is not installed. Please install it first:
    
    # macOS
    brew tap databricks/tap
    brew install databricks
    
    See: https://docs.databricks.com/dev-tools/cli/install"
fi

# -----------------------------------------------------------------------------
# Step 2: Check Databricks authentication
# -----------------------------------------------------------------------------
info "Checking Databricks authentication..."
if databricks current-user me &> /dev/null; then
    DATABRICKS_USER=$(databricks current-user me 2>/dev/null | jq -r '.userName // .user_name // "unknown"')
    success "Authenticated as: $DATABRICKS_USER"
else
    error "Not authenticated with Databricks. Please run:
    
    databricks auth login
    
    Or run ./scripts/quickstart.sh to set up your environment."
fi

# -----------------------------------------------------------------------------
# Step 3: Check app.yaml exists
# -----------------------------------------------------------------------------
info "Checking app.yaml configuration..."
if [ -f "app.yaml" ]; then
    success "app.yaml found"
else
    error "app.yaml not found. Please run this script from the project root."
fi

# -----------------------------------------------------------------------------
# Step 4: Check MLFLOW_EXPERIMENT_ID is set in app.yaml
# -----------------------------------------------------------------------------
info "Checking MLflow experiment configuration..."
MLFLOW_EXP_ID=$(grep -A1 "MLFLOW_EXPERIMENT_ID" app.yaml | grep "value:" | sed 's/.*value: *"\{0,1\}\([^"]*\)"\{0,1\}/\1/' | tr -d ' ')

# Also check .env.local for the experiment ID
LOCAL_EXP_ID=""
if [ -f ".env.local" ]; then
    LOCAL_EXP_ID=$(grep "^MLFLOW_EXPERIMENT_ID=" .env.local 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d ' ' || true)
fi

if [ -z "$MLFLOW_EXP_ID" ] || [ "$MLFLOW_EXP_ID" = '""' ]; then
    warn "MLFLOW_EXPERIMENT_ID is not set in app.yaml"
    echo ""
    
    # Suggest the value from .env.local if available
    if [ -n "$LOCAL_EXP_ID" ]; then
        echo "  Found experiment ID in .env.local: $LOCAL_EXP_ID"
        echo ""
        read -p "  Use this experiment ID? [Y/n]: " USE_LOCAL
        if [ -z "$USE_LOCAL" ] || [ "$USE_LOCAL" = "y" ] || [ "$USE_LOCAL" = "Y" ]; then
            MLFLOW_EXP_ID="$LOCAL_EXP_ID"
        fi
    fi
    
    # If still empty, prompt user to enter it
    if [ -z "$MLFLOW_EXP_ID" ] || [ "$MLFLOW_EXP_ID" = '""' ]; then
        echo ""
        echo "  Enter your MLflow experiment ID (or press Enter to skip):"
        read -p "  Experiment ID: " MLFLOW_EXP_ID
    fi
    
    # Update app.yaml if we have an experiment ID
    if [ -n "$MLFLOW_EXP_ID" ] && [ "$MLFLOW_EXP_ID" != '""' ]; then
        info "Updating app.yaml with experiment ID..."
        # Use sed to update the MLFLOW_EXPERIMENT_ID value in app.yaml
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS sed requires empty string for -i
            sed -i '' "s/\(MLFLOW_EXPERIMENT_ID\)$/\1/; /MLFLOW_EXPERIMENT_ID/{n;s/value: *\"[^\"]*\"/value: \"$MLFLOW_EXP_ID\"/;}" app.yaml
        else
            sed -i "s/\(MLFLOW_EXPERIMENT_ID\)$/\1/; /MLFLOW_EXPERIMENT_ID/{n;s/value: *\"[^\"]*\"/value: \"$MLFLOW_EXP_ID\"/;}" app.yaml
        fi
        success "Updated app.yaml with MLFLOW_EXPERIMENT_ID: $MLFLOW_EXP_ID"
    else
        warn "Skipping MLFLOW_EXPERIMENT_ID configuration."
        echo "  MLflow tracing will not work until this is configured."
        echo "  Run ./scripts/quickstart.sh to create an experiment."
        echo ""
    fi
else
    success "MLFLOW_EXPERIMENT_ID is configured: $MLFLOW_EXP_ID"
fi

# -----------------------------------------------------------------------------
# Step 5: Sync files to workspace
# -----------------------------------------------------------------------------
info "Syncing files to Databricks workspace..."

# Use a separate path for app source code (avoid conflict with MLflow experiments)
WORKSPACE_PATH="/Workspace/Users/$DATABRICKS_USER/apps/$APP_NAME"
info "Target path: $WORKSPACE_PATH"

# Sync the project files
databricks sync . "$WORKSPACE_PATH"

success "Files synced to $WORKSPACE_PATH"

# -----------------------------------------------------------------------------
# Done - Provide UI deployment instructions
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "  Files Synced Successfully!"
echo "=========================================="
echo ""
echo "Source code synced to: $WORKSPACE_PATH"
echo ""
echo "To deploy the app, follow these steps in the Databricks UI:"
echo ""
echo "  1. Go to Compute > Apps in your Databricks workspace"
echo ""
echo "  2. If the app doesn't exist yet:"
echo "     - Click 'Create App'"
echo "     - Name it: $APP_NAME"
echo ""
echo "  3. Click on the app, then click 'Deploy'"
echo ""
echo "  4. Select the source folder:"
echo "     $WORKSPACE_PATH"
echo ""
echo "  5. Click 'Deploy' to start the deployment"
echo ""
echo "After deployment, you can access the app from the Apps page."
echo ""

#!/bin/bash
# Build script for the Genie Space Analyzer
# Builds the React frontend and prepares for deployment

set -e

echo "=== Building Genie Space Analyzer ==="

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo "1. Installing Python dependencies..."
uv sync --quiet

echo ""
echo "2. Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "3. Verifying build..."
if [ -d "frontend/dist" ] && [ -f "frontend/dist/index.html" ]; then
    echo "   ✓ Frontend build successful"
else
    echo "   ✗ Frontend build failed - dist directory not found"
    exit 1
fi

echo ""
echo "=== Build Complete ==="
echo ""
echo "To run locally:"
echo "  Terminal 1: cd frontend && npm run dev"
echo "  Terminal 2: uv run start-server"
echo ""
echo "To deploy to Databricks Apps:"
echo "  databricks apps deploy <app-name> --source-path ."

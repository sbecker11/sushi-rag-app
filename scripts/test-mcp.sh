#!/usr/bin/env bash
# Run MCP Python tests (creates mcp/.venv with 3.11/3.12/3 if needed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mcp"

if [[ ! -x .venv/bin/python ]]; then
  if command -v python3.11 &>/dev/null; then
    python3.11 -m venv .venv
  elif command -v python3.12 &>/dev/null; then
    python3.12 -m venv .venv
  else
    python3 -m venv .venv
  fi
fi

.venv/bin/pip install -q -r requirements-dev.txt
exec .venv/bin/python -m pytest tests/ "$@"

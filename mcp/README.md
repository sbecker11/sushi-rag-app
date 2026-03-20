# Sushi RAG MCP Server

Python **MCP** server that exposes the same Chroma-backed menu index as the main app (`CHROMA_COLLECTION=sushi_menu` by default). Use it from **Claude Desktop**, **Cursor** (MCP), or any MCP client.

## Tools

| Tool | Description |
|------|-------------|
| `sushi_rag_query` | RAG answer; **constrained** questions (price / category / spice) return a deterministic sorted list (aligned with backend RAG). |
| `sushi_semantic_search` | Semantic search with scores (no LLM synthesis). |
| `sushi_list_topics` | List unique topics / categories / dietary tags from collection metadata. |

## Resource

- `sushi://knowledge-base/stats` — chunk count and Chroma connection info.

## Prerequisites

- **Python 3.11+** recommended (3.14+ may hit resolver issues with some wheels; use 3.11 or 3.12 for the venv).
1. **ChromaDB running** — e.g. from the repo root: `npm run docker:up` (same stack as the Node backend).
2. **Menu indexed** — start the backend once so `vectorStore.indexMenu` populates `sushi_menu`, or your data is already in that collection.

## Setup

```bash
cd mcp
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env — set OPENAI_API_KEY (and CHROMA_* if not localhost:8000)
```

## Run

**stdio** (typical for Cursor / Claude Desktop):

```bash
source venv/bin/activate
python server.py
```

**HTTP** (optional):

```bash
python server.py --http --port 8010
```

> Use a port **other than 8000** if Chroma is already bound to 8000 locally.

Logs and status lines go to **stderr** so stdout stays JSON-RPC–clean.

## Cursor / Claude Desktop

- Merge `claude_desktop_config.example.json` into your client config, replacing:
  - `/ABSOLUTE/PATH/TO/sushi-rag-app` with this repo’s path.
  - `python3` with `.../mcp/venv/bin/python` if you use a venv.
- **Cursor**: Settings → MCP → add server command pointing at `mcp/server.py` with the same `env` as in the example.

## Tests

```bash
cd mcp
python3.11 -m venv .venv          # or python3.12
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest tests/ -q
```

- **`tests/test_constraints.py`** — pure constraint logic (no Chroma/LangChain).
- **`tests/test_server_helpers.py`** — `_format_docs`, `_handle_error`, `_format_sources`.
- **`tests/test_tools.py`** — MCP tools with mocked vector store (no real DB).

## Inspect / debug

```bash
cd mcp
source venv/bin/activate
npx @modelcontextprotocol/inspector python server.py
```

## Example prompts

See [docs/04_QUERY_EXAMPLES.md](../docs/04_QUERY_EXAMPLES.md).

## Notes

- `.env` is loaded from **`mcp/.env`** (same folder as `server.py`).
- Root app `.env` is **not** read automatically; duplicate `OPENAI_API_KEY` into `mcp/.env` or pass vars via the MCP client config.

# Documentation Structure

## Main Documentation (docs/)

Clean, consecutive numbering for user-facing documentation:

### 00: Getting Started
- **00_SETUP.md** - Complete setup, configuration, environment, and OpenAI guide (all-in-one)

### 01: Docker & Infrastructure
- **01_DOCKER_WORKFLOW.md** - Complete Docker workflow (combined health checks + automated startup)

### 02: Testing
- **02_TESTING.md** - Complete testing guide with statistics, examples, and best practices (all-in-one)

### 03: AI Agent and Tools
- **03_AI_AGENT_AND_TOOLS.md** - Multi-tool agent behavior, semantic search vs tools, price filter bounds, and design notes for filters and popularity

### 04: Query Examples
- **04_QUERY_EXAMPLES.md** - Ready-to-use prompt examples for frontend chat and MCP tools

---

## Archive (docs/archive/)

Historical implementation notes and changelogs (no number prefixes):

### Implementation Guides
- **FUTURE_AI_STACK_ENHANCEMENTS.md** - Technical AI/RAG architecture guide (useful for future enhancements)
- **IMPLEMENTATION_CHECKLIST.md** - Step-by-step AI implementation checklist
- **DOCKER_CHECK_IMPLEMENTATION.md** - Docker health check implementation notes
- **RAG_IMPLEMENTATION_COMPLETE.md** - RAG feature completion summary

### Historical Changes
- **CHANGES_SUMMARY.md** - Docker check implementation changes
- **PACKAGE_NAME_FIX.md** - Package renaming from "sushi-agent" to "sushi-rag-app"
- **PORT_FIXES.md** - Port conflict fixes

### Archive Notes
See [docs/archive/README.md](docs/archive/README.md) for details on why these were archived.

---

## Benefits of This Structure

✅ **Clean numbering**: 00-04 consecutive sequence  
✅ **Easy navigation**: Logical grouping by topic  
✅ **Reduced clutter**: Historical docs separated  
✅ **Maintainable**: New docs can be added without gaps  
✅ **Professional**: Clear organization for portfolio/GitHub  
✅ **Fully consolidated**: Each doc is comprehensive and self-contained

---

*Last updated: March 19, 2026*

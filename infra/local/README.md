# Local Profile (Docker)

This folder documents the local development deployment profile.

Current implementation uses:

- root-level `docker-compose.yml` for PostgreSQL and ChromaDB
- root npm scripts for orchestration (`dev`, `prestart`, `dev:clean`)

## Standard startup

```bash
npm run dev
```

## Clean startup (recommended when ports/containers conflict)

```bash
npm run dev:clean
```

## Core local checks

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/assistant/status
```

## Troubleshooting reference

See:

- `docs/00_SETUP.md` (Troubleshooting section)


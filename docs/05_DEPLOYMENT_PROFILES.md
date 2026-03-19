# Deployment Profiles

This project supports two deployment profiles from the same codebase:

- **Local Docker profile** for development and validation
- **AWS Fargate profile** for staging/production

The goal is to keep application logic shared and only vary infrastructure/runtime configuration.

---

## Profile 1: Local Docker (Current)

Use this profile for day-to-day development and troubleshooting.

### Components

- Frontend: Vite dev server on `http://localhost:5173`
- Backend: Express API on `http://localhost:3001`
- PostgreSQL: Docker container (`sushi-rag-app-postgres`)
- ChromaDB: Docker container (`sushi-rag-app-chromadb`)

### Startup

```bash
npm run dev
```

If local state is messy:

```bash
npm run dev:clean
```

### Configuration source

- Root `.env`

---

## Profile 2: AWS Fargate (Target)

Use this profile for managed cloud deployment.

### Recommended architecture

- **Frontend**: S3 + CloudFront (recommended for static assets)
- **Backend**: ECS Fargate service behind ALB
- **Database**: Amazon RDS PostgreSQL
- **Vector store**:
  - Option A: ChromaDB on ECS/Fargate + EFS (stateful)
  - Option B: Managed vector DB (lower ops burden)
- **Secrets**: AWS Secrets Manager / SSM Parameter Store
- **Container images**: ECR

### Configuration source

- ECS task definition environment variables
- Secrets Manager references

---

## Shared Principles Across Both Profiles

- Single application codebase
- Environment-driven behavior (no per-profile logic forks)
- Same API contract (`/api/menu`, `/api/orders`, `/api/assistant/*`)
- Deterministic constrained-query behavior in both app and MCP paths

---

## Migration Checklist (Local -> Fargate)

1. **Containerize backend for production**
   - Build backend image and push to ECR.
2. **Externalize stateful services**
   - Move PostgreSQL to RDS.
   - Choose Chroma-on-Fargate+EFS or managed vector DB.
3. **Wire network and service discovery**
   - VPC, subnets, security groups, ALB target groups.
4. **Move secrets and config**
   - `OPENAI_API_KEY`, DB creds, service endpoints from `.env` to Secrets Manager.
5. **Set health checks and autoscaling**
   - ALB health checks and ECS service scaling policies.
6. **Roll out by environment**
   - dev/staging/prod with separate task definitions and secrets.

---

## Environment Variable Mapping

| Purpose | Local Docker | AWS Fargate |
|---|---|---|
| Backend port | `PORT=3001` | Task/container env `PORT` |
| Frontend URL for CORS | `FRONTEND_URL=http://localhost:5173` | CloudFront or app domain URL |
| Postgres host | `POSTGRES_HOST=localhost` | RDS endpoint |
| Chroma host | `CHROMA_HOST=localhost` | Chroma service DNS / managed endpoint |
| OpenAI key | `.env` | Secrets Manager |

---

## Notes on Bedrock

If adopting AWS Bedrock later:

- replace OpenAI chat/embeddings providers in app and MCP server
- re-embed and re-index vector data (embedding spaces are model-specific)
- keep the same deployment profile structure described here


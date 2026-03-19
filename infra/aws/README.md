# AWS Profile (Fargate)

This folder is a placeholder for AWS infrastructure-as-code and deployment assets.

Recommended target architecture:

- Frontend: S3 + CloudFront
- Backend API: ECS Fargate service behind ALB
- PostgreSQL: Amazon RDS
- Vector store:
  - ChromaDB on ECS/Fargate + EFS, or
  - managed vector store alternative
- Secrets: AWS Secrets Manager
- Images: ECR

## Suggested future structure

```text
infra/aws/
  README.md
  terraform/ or cdk/
  task-definitions/
  env/
```

## Rollout phases

1. **Phase 1**
   - Deploy backend only on Fargate.
   - Keep current model provider.
2. **Phase 2**
   - Move frontend to CloudFront.
   - Add autoscaling and alarms.
3. **Phase 3**
   - Optional Bedrock migration for LLM + embeddings.
   - Rebuild vector index if embedding provider changes.

## Key parity rules with local

- Keep endpoint contracts unchanged.
- Keep constrained-query deterministic behavior unchanged.
- Keep environment variable names aligned across profiles.


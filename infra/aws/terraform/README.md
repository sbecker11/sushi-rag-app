# Terraform Scaffold (AWS Fargate)

This is a non-destructive Terraform scaffold for deploying the backend API to ECS Fargate.

It currently includes:

- VPC with public subnets
- Application Load Balancer + target group + listener
- ECS cluster
- ECR repository for backend image
- ECS task definition + ECS service
- CloudWatch log group
- IAM task execution role
- RDS PostgreSQL instance
- Secrets Manager wiring for `OPENAI_API_KEY` and `POSTGRES_PASSWORD`

It does **not** yet create:

- ChromaDB/EFS service
- Secrets Manager values
- CloudFront/S3 frontend hosting
- autoscaling/policies/alarms

## Usage

```bash
cd infra/aws/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars
terraform init
terraform plan
```

### Security note

This scaffold stores secret values via Terraform-managed `aws_secretsmanager_secret_version`.
For production, prefer CI/CD injected secret updates and avoid committing real values in tfvars.

## Notes

- This scaffold is intended for iterative completion.
- Default networking is intentionally simple for first deployment.
- Use remote state (S3 + DynamoDB lock table) before team/shared use.


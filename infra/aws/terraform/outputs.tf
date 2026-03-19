output "alb_dns_name" {
  description = "ALB DNS name for backend API."
  value       = aws_lb.backend.dns_name
}

output "backend_base_url" {
  description = "Backend base URL."
  value       = "http://${aws_lb.backend.dns_name}"
}

output "backend_health_url" {
  description = "Backend health endpoint URL."
  value       = "http://${aws_lb.backend.dns_name}/api/health"
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend image."
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint address."
  value       = aws_db_instance.postgres.address
}

output "openai_secret_arn" {
  description = "Secrets Manager ARN for OPENAI_API_KEY."
  value       = aws_secretsmanager_secret.openai_api_key.arn
}

output "db_password_secret_arn" {
  description = "Secrets Manager ARN for PostgreSQL password."
  value       = aws_secretsmanager_secret.db_password.arn
}


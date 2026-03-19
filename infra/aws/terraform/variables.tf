variable "project_name" {
  description = "Project/service name prefix."
  type        = string
  default     = "sushi-rag-app"
}

variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "backend_container_port" {
  description = "Backend container port."
  type        = number
  default     = 3001
}

variable "desired_count" {
  description = "Desired number of backend tasks."
  type        = number
  default     = 1
}

variable "task_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 1024
}

variable "backend_image_tag" {
  description = "Container image tag for backend service."
  type        = string
  default     = "latest"
}

variable "frontend_url" {
  description = "Frontend URL allowed for CORS."
  type        = string
  default     = "http://localhost:5173"
}

variable "openai_api_key" {
  description = "OpenAI API key. For scaffold use only; move to Secrets Manager in production."
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_name" {
  description = "RDS PostgreSQL database name."
  type        = string
  default     = "sushi_rag_app_orders"
}

variable "db_username" {
  description = "RDS PostgreSQL master username."
  type        = string
  default     = "sushi_rag_app_user"
}

variable "db_password" {
  description = "RDS PostgreSQL master password."
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "16.3"
}

variable "chroma_host" {
  description = "ChromaDB host endpoint."
  type        = string
  default     = "REPLACE_ME_CHROMA_ENDPOINT"
}

variable "chroma_port" {
  description = "ChromaDB port."
  type        = number
  default     = 8000
}


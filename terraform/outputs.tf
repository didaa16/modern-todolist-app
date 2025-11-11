output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.todolist_vpc.id
}

output "ecr_server_repository_url" {
  description = "ECR Server Repository URL"
  value       = aws_ecr_repository.server.repository_url
}

output "ecr_client_repository_url" {
  description = "ECR Client Repository URL"
  value       = aws_ecr_repository.client.repository_url
}

output "security_group_id" {
  description = "Security Group ID"
  value       = aws_security_group.todolist_sg.id
}
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# VPC for EKS
resource "aws_vpc" "todolist_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "todolist-vpc"
    Environment = var.environment
    Project     = "modern-todolist"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "todolist_igw" {
  vpc_id = aws_vpc.todolist_vpc.id

  tags = {
    Name = "todolist-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.todolist_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "todolist-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.todolist_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "todolist-public-subnet-2"
  }
}

# Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.todolist_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.todolist_igw.id
  }

  tags = {
    Name = "todolist-public-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Group for Application
resource "aws_security_group" "todolist_sg" {
  name        = "todolist-sg"
  description = "Security group for ToDoList application"
  vpc_id      = aws_vpc.todolist_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "todolist-sg"
  }
}

# ECR Repositories
resource "aws_ecr_repository" "server" {
  name                 = "todolist-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "modern-todolist"
  }
}

resource "aws_ecr_repository" "client" {
  name                 = "todolist-client"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "modern-todolist"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "todolist_logs" {
  name              = "/aws/todolist"
  retention_in_days = 7

  tags = {
    Environment = var.environment
    Application = "todolist"
  }
}
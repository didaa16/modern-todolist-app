.PHONY: help build up down logs clean test deploy-k8s destroy-k8s

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start services with docker-compose
	docker-compose up -d

down: ## Stop services
	docker-compose down

logs: ## View logs
	docker-compose logs -f

clean: ## Remove containers, images, and volumes
	docker-compose down -v
	docker system prune -af

test: ## Run tests
	cd server && npm test
	cd client && npm test

build-prod: ## Build production images
	docker build -t dida1609/todolist-server:latest ./server
	docker build -t dida1609/todolist-client:latest ./client

push: ## Push images to Docker Hub
	docker push dida1609/todolist-server:latest
	docker push dida1609/todolist-client:latest

deploy-k8s: ## Deploy to Kubernetes
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/pvc.yaml
	kubectl apply -f k8s/server-deployment.yaml
	kubectl apply -f k8s/client-deployment.yaml
	kubectl get pods -n todolist

destroy-k8s: ## Destroy Kubernetes deployment
	kubectl delete -f k8s/client-deployment.yaml
	kubectl delete -f k8s/server-deployment.yaml
	kubectl delete -f k8s/pvc.yaml
	kubectl delete -f k8s/namespace.yaml

status-k8s: ## Check Kubernetes deployment status
	kubectl get all -n todolist

logs-k8s: ## View Kubernetes logs
	kubectl logs -f -l app=todolist-server -n todolist

terraform-init: ## Initialize Terraform
	cd terraform && terraform init

terraform-plan: ## Plan Terraform changes
	cd terraform && terraform plan

terraform-apply: ## Apply Terraform changes
	cd terraform && terraform apply

terraform-destroy: ## Destroy Terraform infrastructure
	cd terraform && terraform destroy

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down
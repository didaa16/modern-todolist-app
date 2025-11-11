# Deployment Checklist

## Before Deployment

- [ ] Update `.env` files with correct values
- [ ] Verify Docker Hub credentials
- [ ] Ensure Kubernetes cluster is running
- [ ] Configure kubectl context
- [ ] Set up GitHub secrets
- [ ] Configure Jenkins credentials
- [ ] Review resource limits in K8s manifests
- [ ] Test locally with docker-compose

## GitHub Setup

- [ ] Create repository on GitHub
- [ ] Push code to repository
- [ ] Add `DOCKER_HUB_TOKEN` secret
- [ ] Enable GitHub Actions
- [ ] Test GitHub Actions workflow

## Jenkins Setup

- [ ] Install required plugins
- [ ] Add Docker_Token credential
- [ ] Add Github_Token credential
- [ ] Add SonarQube_token credential (optional)
- [ ] Configure kubectl access
- [ ] Create pipeline job
- [ ] Test pipeline manually
- [ ] Set up webhook for automatic builds

## Kubernetes Deployment

- [ ] Create namespace: `kubectl apply -f k8s/namespace.yaml`
- [ ] Create PVC: `kubectl apply -f k8s/pvc.yaml`
- [ ] Deploy server: `kubectl apply -f k8s/server-deployment.yaml`
- [ ] Deploy client: `kubectl apply -f k8s/client-deployment.yaml`
- [ ] Verify pods are running: `kubectl get pods -n todolist`
- [ ] Check services: `kubectl get svc -n todolist`
- [ ] Test application access

## Monitoring Setup

- [ ] Deploy Prometheus: `kubectl apply -f monitoring/prometheus-deployment.yaml`
- [ ] Deploy Grafana: `kubectl apply -f monitoring/grafana-deployment.yaml`
- [ ] Access Grafana dashboard
- [ ] Import dashboard configuration
- [ ] Configure alerts

## Terraform (Optional)

- [ ] Configure AWS credentials
- [ ] Initialize Terraform: `terraform init`
- [ ] Review plan: `terraform plan`
- [ ] Apply infrastructure: `terraform apply`
- [ ] Verify resources in AWS console

## Post-Deployment

- [ ] Run smoke tests
- [ ] Monitor logs for errors
- [ ] Verify data persistence
- [ ] Test auto-scaling (if configured)
- [ ] Document any issues
- [ ] Update runbook

## Rollback Plan

- [ ] Document current stable version
- [ ] Test rollback procedure:
```bash
  kubectl rollout undo deployment/todolist-server -n todolist
  kubectl rollout undo deployment/todolist-client -n todolist
```
```

---

## Summary of All Files to Create

Here's the complete file structure you need to create:
```
modern-todolist-app/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── .husky/
│   └── pre-commit
├── client/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── nginx.conf
├── server/
│   ├── Dockerfile
│   └── Dockerfile.dev
├── k8s/
│   ├── namespace.yaml
│   ├── pvc.yaml
│   ├── server-deployment.yaml
│   ├── client-deployment.yaml
│   └── ingress.yaml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── monitoring/
│   ├── prometheus-config.yml
│   ├── prometheus-deployment.yaml
│   ├── grafana-deployment.yaml
│   └── grafana-dashboard.json
├── docs/
│   ├── JENKINS_SETUP.md
│   └── DEPLOYMENT_CHECKLIST.md
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-swarm-stack.yml
├── Jenkinsfile
├── Makefile
├── .env.example
└── README.md (updated)
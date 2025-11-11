# Jenkins Setup Guide

## Prerequisites

1. Jenkins installed and running
2. Docker installed on Jenkins server
3. kubectl configured with access to your Kubernetes cluster
4. SonarQube running (optional)

## Required Jenkins Plugins

Install these plugins via Jenkins → Manage Jenkins → Manage Plugins:

- Docker Pipeline
- Kubernetes CLI
- Git
- SonarQube Scanner
- Pipeline

## Configure Credentials

### 1. Docker Hub Token

1. Go to Jenkins → Manage Jenkins → Manage Credentials
2. Click "Global" → "Add Credentials"
3. Type: Username with password
4. ID: `Docker_Token`
5. Username: `dida1609`
6. Password: Your Docker Hub token

### 2. GitHub Token

1. Generate token at GitHub → Settings → Developer settings → Personal access tokens
2. Add to Jenkins:
   - ID: `Github_Token`
   - Type: Username with password
   - Username: `didaa16`
   - Password: Your GitHub token

### 3. SonarQube Token (Optional)

1. Generate token in SonarQube → My Account → Security → Generate Tokens
2. Add to Jenkins:
   - ID: `SonarQube_token`
   - Type: Username with password
   - Username: Leave blank or 'admin'
   - Password: Your SonarQube token

## Configure Kubernetes Access

Ensure Jenkins can access your Kubernetes cluster:
```bash
# Copy kubeconfig to Jenkins
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown jenkins:jenkins /var/lib/jenkins/.kube/config
```

Or configure it via Jenkins Kubernetes plugin.

## Create Pipeline Job

1. New Item → Pipeline
2. Name: "todolist-pipeline"
3. Pipeline section:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: https://github.com/didaa16/modern-todolist-app.git
   - Credentials: Github_Token
   - Branch: */master
   - Script Path: Jenkinsfile
4. Save

## Configure Webhooks (Optional)

For automatic builds on push:

1. Go to your GitHub repo → Settings → Webhooks
2. Add webhook:
   - Payload URL: `http://your-jenkins-url/github-webhook/`
   - Content type: application/json
   - Events: Just the push event
3. Enable "GitHub hook trigger for GITScm polling" in Jenkins job

## Test the Pipeline

1. Click "Build Now"
2. Monitor the console output
3. Verify deployment: `kubectl get pods -n todolist`

## Troubleshooting

### Docker permission denied
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### kubectl command not found
```bash
# Install kubectl on Jenkins server
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### SonarQube connection failed

- Ensure SonarQube is running
- Check firewall rules
- Verify SonarQube URL in Jenkinsfile
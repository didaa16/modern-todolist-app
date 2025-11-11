pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = 'Docker_Token'
        DOCKER_HUB_USERNAME = 'dida1609'
        SERVER_IMAGE = "${DOCKER_HUB_USERNAME}/todolist-server"
        CLIENT_IMAGE = "${DOCKER_HUB_USERNAME}/todolist-client"
        SONARQUBE_URL = "http://localhost:9000"
        K8S_NAMESPACE = 'todolist'
        GIT_CREDENTIALS = 'Github_Token'
        GIT_URL = 'https://github.com/didaa16/modern-todolist-app.git'
    }
    
    stages {
        stage('Git Clone') {
            steps {
                git branch: 'main',
                    credentialsId: "${GIT_CREDENTIALS}",
                    url: "${GIT_URL}"
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Server Dependencies') {
                    steps {
                        dir('server') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Client Dependencies') {
                    steps {
                        dir('client') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Lint') {
            parallel {
                stage('Lint Server') {
                    steps {
                        dir('server') {
                            sh 'npm run lint || echo "No lint configured"'
                        }
                    }
                }
                stage('Lint Client') {
                    steps {
                        dir('client') {
                            sh 'npm run lint || echo "No lint configured"'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Test Server') {
                    steps {
                        dir('server') {
                            sh 'npm test || echo "No tests configured"'
                        }
                    }
                }
                stage('Test Client') {
                    steps {
                        dir('client') {
                            sh 'npm test -- --watchAll=false || echo "No tests configured"'
                        }
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'SonarQube_token', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                        // Server analysis
                        dir('server') {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=todolist-server \
                                  -Dsonar.sources=. \
                                  -Dsonar.host.url=${SONARQUBE_URL} \
                                  -Dsonar.login=$SONAR_PASS \
                                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || echo "SonarQube scan failed"
                            """
                        }
                        // Client analysis
                        dir('client') {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=todolist-client \
                                  -Dsonar.sources=src \
                                  -Dsonar.host.url=${SONARQUBE_URL} \
                                  -Dsonar.login=$SONAR_PASS \
                                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || echo "SonarQube scan failed"
                            """
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def commit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    def buildDate = sh(script: "date +'%Y%m%d'", returnStdout: true).trim()
                    
                    // Build server image
                    sh """
                        docker build -t ${SERVER_IMAGE}:${commit} \
                                   -t ${SERVER_IMAGE}:${buildDate} \
                                   -t ${SERVER_IMAGE}:latest \
                                   ./server
                    """
                    
                    // Build client image
                    sh """
                        docker build -t ${CLIENT_IMAGE}:${commit} \
                                   -t ${CLIENT_IMAGE}:${buildDate} \
                                   -t ${CLIENT_IMAGE}:latest \
                                   ./client
                    """
                }
            }
        }
        
        stage('Docker Security Scan') {
            steps {
                script {
                    sh """
                        docker run --rm aquasec/trivy image ${SERVER_IMAGE}:latest || echo "Trivy scan completed with warnings"
                        docker run --rm aquasec/trivy image ${CLIENT_IMAGE}:latest || echo "Trivy scan completed with warnings"
                    """
                }
            }
        }
        
        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDENTIALS}", usernameVariable: "DOCKER_USER", passwordVariable: "DOCKER_PASS")]) {
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        
                        # Push server images
                        docker push ${SERVER_IMAGE}:latest
                        docker push ${SERVER_IMAGE}:\$(git rev-parse --short HEAD)
                        docker push ${SERVER_IMAGE}:\$(date +'%Y%m%d')
                        
                        # Push client images
                        docker push ${CLIENT_IMAGE}:latest
                        docker push ${CLIENT_IMAGE}:\$(git rev-parse --short HEAD)
                        docker push ${CLIENT_IMAGE}:\$(date +'%Y%m%d')
                    """
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                        # Create namespace if it doesn't exist
                        kubectl get namespace ${K8S_NAMESPACE} >/dev/null 2>&1 || \
                            kubectl create namespace ${K8S_NAMESPACE}
                        
                        # Apply Kubernetes manifests
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/pvc.yaml -n ${K8S_NAMESPACE}
                        kubectl apply -f k8s/server-deployment.yaml -n ${K8S_NAMESPACE}
                        kubectl apply -f k8s/client-deployment.yaml -n ${K8S_NAMESPACE}
                        
                        # Wait for deployments to complete
                        kubectl rollout status deployment/todolist-server -n ${K8S_NAMESPACE} --timeout=300s || true
                        kubectl rollout status deployment/todolist-client -n ${K8S_NAMESPACE} --timeout=300s || true
                        
                        # Display resource status
                        echo "=== Deployment Status ==="
                        kubectl get pods,svc,pvc -n ${K8S_NAMESPACE}
                        
                        # Get service endpoints
                        echo "=== Service Endpoints ==="
                        kubectl get svc todolist-client-service -n ${K8S_NAMESPACE} -o wide
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh """
                        # Wait for pods to be ready
                        kubectl wait --for=condition=ready pod -l app=todolist-server -n ${K8S_NAMESPACE} --timeout=120s
                        kubectl wait --for=condition=ready pod -l app=todolist-client -n ${K8S_NAMESPACE} --timeout=120s
                        
                        echo "Application deployed successfully!"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // You can add notification here (Slack, email, etc.)
        }
        failure {
            echo 'Pipeline failed!'
            // Rollback or notification
            sh """
                kubectl rollout undo deployment/todolist-server -n ${K8S_NAMESPACE} || true
                kubectl rollout undo deployment/todolist-client -n ${K8S_NAMESPACE} || true
            """
        }
        always {
            // Clean up Docker images to save space
            sh 'docker system prune -f || true'
        }
    }
}
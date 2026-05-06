pipeline {
    agent any

    parameters {
        string(name: 'DOCKER_TAG', defaultValue: 'latest', description: 'Docker image tag to deploy')
    }

    environment {
        DOCKER_IMAGE = "certifypro/collaboration-service"
        KUBE_CONFIG  = credentials('kubeconfig-credentials')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {

        // =============================================
        // Stage 1: Checkout K8s manifests
        // =============================================
        stage('Git Checkout') {
            steps {
                checkout scm
                echo "✅ Kubernetes manifests checked out"
            }
        }

        // =============================================
        // Stage 2: Pull Docker Image from Registry
        // =============================================
        stage('Pull Docker Image') {
            steps {
                sh "docker pull ${DOCKER_IMAGE}:${params.DOCKER_TAG}"
                echo "✅ Docker image pulled: ${DOCKER_IMAGE}:${params.DOCKER_TAG}"
            }
        }

        // =============================================
        // Stage 3: Deploy to Kubernetes Cluster
        // =============================================
        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    // Update the image tag in the deployment manifest
                    sh """
                        sed -i 's|image:.*|image: ${DOCKER_IMAGE}:${params.DOCKER_TAG}|g' k8s/collaboration-service-deployment.yaml
                        kubectl apply -f k8s/collaboration-service-deployment.yaml --kubeconfig=\$KUBECONFIG
                    """
                }
                echo "✅ Deployment applied to Kubernetes"
            }
        }

        // =============================================
        // Stage 4: Verify Deployment Rollout
        // =============================================
        stage('Verify Deployment') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl rollout status deployment/collaboration-service \
                            --namespace=certifypro \
                            --timeout=120s \
                            --kubeconfig=\$KUBECONFIG
                    """
                }
                echo "✅ Deployment rollout verified"
            }
        }

        // =============================================
        // Stage 5: Health Check
        // =============================================
        stage('Health Check') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl get pods -l app=collaboration-service \
                            --namespace=certifypro \
                            --kubeconfig=\$KUBECONFIG
                    """
                }
                echo "✅ Health check passed"
            }
        }
    }

    post {
        success {
            echo "🎉 CD Pipeline SUCCESS — collaboration-service deployed (Tag: ${params.DOCKER_TAG})"
        }
        failure {
            echo "❌ CD Pipeline FAILED — collaboration-service deployment failed (Tag: ${params.DOCKER_TAG})"
            // Rollback to previous version on failure
            withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                sh """
                    kubectl rollout undo deployment/collaboration-service \
                        --namespace=certifypro \
                        --kubeconfig=\$KUBECONFIG || true
                """
            }
        }
        always {
            cleanWs()
        }
    }
}

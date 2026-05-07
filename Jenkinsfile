pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        BACKEND_SONAR_CONFIG = 'backend/sonar-project.properties'
        FRONTEND_SONAR_CONFIG = 'frontend/sonar-project.properties'
        SONARQUBE_TOKEN_CREDENTIALS_ID = 'sonarqube-token'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Verify') {
            parallel {
                stage('api-gateway') {
                    steps {
                        dir("${BACKEND_DIR}/api-gateway") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('discovery-server') {
                    steps {
                        dir("${BACKEND_DIR}/discovery-server") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('user-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/user-service") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('training-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/training-service") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('event-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/event-service") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('ecommerce-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/ecommerce") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('forum-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/forum_service") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('collaboration-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/collaboration-service") {
                            sh 'mvn clean verify'
                        }
                    }
                }

                stage('planned-session-service') {
                    steps {
                        dir("${BACKEND_DIR}/services/planned-session-service") {
                            sh 'mvn clean verify'
                        }
                    }
                }
            }
        }

        stage('Frontend Test & Build') {
            steps {
                dir(FRONTEND_DIR) {
                    sh 'npm ci'
                    sh 'npm test -- --watch=false --coverage'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withCredentials([string(credentialsId: SONARQUBE_TOKEN_CREDENTIALS_ID, variable: 'SONAR_TOKEN')]) {
                        sh '''
                            sonar-scanner -Dproject.settings=${BACKEND_SONAR_CONFIG} -Dsonar.login=${SONAR_TOKEN}
                            sonar-scanner -Dproject.settings=${FRONTEND_SONAR_CONFIG} -Dsonar.login=${SONAR_TOKEN}
                        '''
                    }
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir(BACKEND_DIR) {
                    sh '''
                        command -v minikube >/dev/null 2>&1 || { echo "minikube is required on Jenkins agent"; exit 1; }

                        eval $(minikube docker-env)

                        docker build -t certifypro-discovery:latest discovery-server
                        docker build -t certifypro-gateway:latest api-gateway
                        docker build -t certifypro-user:latest services/user-service
                        docker build -t certifypro-training:latest services/training-service
                        docker build -t certifypro-event:latest services/event-service
                        docker build -t certifypro-ecommerce:latest services/ecommerce
                        docker build -t certifypro-forum:latest services/forum_service
                        docker build -t certifypro-collab:latest services/collaboration-service
                        docker build -t certifypro-planned:latest services/planned-session-service
                        docker build -t certifypro-frontend:latest ../frontend
                    '''
                }
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'devops'
                }
            }
            steps {
                sh '''
                    command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required on Jenkins agent"; exit 1; }
                    command -v minikube >/dev/null 2>&1 || { echo "minikube is required on Jenkins agent"; exit 1; }

                    minikube status
                    minikube addons enable ingress
                    minikube addons enable metrics-server

                    kubectl create namespace certifypro --dry-run=client -o yaml | kubectl apply -f -

                    kubectl -n certifypro create configmap postgres-init-sql \
                        --from-file=init.sql=backend/db/init.sql \
                        --dry-run=client -o yaml | kubectl apply -f -

                    kubectl -n certifypro create configmap prometheus-config \
                        --from-file=prometheus.yml=backend/prometheus.yml \
                        --dry-run=client -o yaml | kubectl apply -f -

                    kubectl -n certifypro create configmap grafana-datasource-config \
                        --from-file=prometheus-datasource.yml=backend/grafana/provisioning/datasources/prometheus-datasource.yml \
                        --dry-run=client -o yaml | kubectl apply -f -

                    kubectl -n certifypro create configmap grafana-dashboards-provider-config \
                        --from-file=dashboards.yml=backend/grafana/provisioning/dashboards/dashboards.yml \
                        --dry-run=client -o yaml | kubectl apply -f -

                    kubectl -n certifypro create configmap grafana-dashboards-json \
                        --from-file=system-metrics.json=backend/grafana/dashboards/system-metrics.json \
                        --from-file=microservices-health.json=backend/grafana/dashboards/microservices-health.json \
                        --dry-run=client -o yaml | kubectl apply -f -

                    kubectl apply -f k8s/namespace.yaml
                    kubectl apply -f k8s/infrastructure
                    kubectl apply -f k8s/app
                    kubectl apply -f k8s/monitoring

                    kubectl -n certifypro rollout status deployment/postgres --timeout=300s
                    kubectl -n certifypro rollout status deployment/discovery-server --timeout=300s
                    kubectl -n certifypro rollout status deployment/api-gateway --timeout=300s
                    kubectl -n certifypro rollout status deployment/user-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/training-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/event-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/ecommerce-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/forum-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/collaboration-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/planned-session-service --timeout=300s
                    kubectl -n certifypro rollout status deployment/frontend --timeout=300s
                    kubectl -n certifypro rollout status deployment/prometheus --timeout=300s
                    kubectl -n certifypro rollout status deployment/grafana --timeout=300s
                    kubectl -n certifypro rollout status deployment/sonarqube --timeout=300s
                '''
            }
        }

        stage('Post-Deploy Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'devops'
                }
            }
            steps {
                sh '''
                    command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required on Jenkins agent"; exit 1; }

                    echo "[SMOKE] Pods status"
                    kubectl -n certifypro get pods -o wide

                    echo "[SMOKE] Services status"
                    kubectl -n certifypro get svc

                    echo "[SMOKE] Endpoints status"
                    kubectl -n certifypro get endpoints

                    NOT_READY_PODS=$(kubectl -n certifypro get pods --no-headers | awk '$2 !~ /^([0-9]+)\/\1$/ || $3 != "Running" {print $1}')
                    if [[ -n "$NOT_READY_PODS" ]]; then
                        echo "[SMOKE] Not ready pods detected:"
                        echo "$NOT_READY_PODS"
                        for POD in $NOT_READY_PODS; do
                            echo "[SMOKE] Describe pod: $POD"
                            kubectl -n certifypro describe pod "$POD" || true
                            echo "[SMOKE] Logs for pod: $POD"
                            kubectl -n certifypro logs "$POD" --all-containers --tail=200 || true
                        done
                        exit 1
                    fi

                    for SVC in api-gateway frontend prometheus grafana sonarqube; do
                        EP=$(kubectl -n certifypro get endpoints "$SVC" -o jsonpath='{.subsets[0].addresses[0].ip}' 2>/dev/null || true)
                        if [[ -z "$EP" ]]; then
                            echo "[SMOKE] Service endpoint missing for: $SVC"
                            exit 1
                        fi
                    done

                    echo "[SMOKE] All smoke tests passed"
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'backend/**/target/*.jar, frontend/dist/**', allowEmptyArchive: true
        }
        cleanup {
            cleanWs()
        }
    }
}
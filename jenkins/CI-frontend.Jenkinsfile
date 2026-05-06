pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE           = "certifypro/frontend"
        DOCKER_TAG             = "${BUILD_NUMBER}"
        SONAR_TOKEN            = credentials('sonarqube-token')
        SERVICE_DIR            = "frontend"
    }

    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {

        // =============================================
        // Stage 1: Checkout source code from Git
        // =============================================
        stage('Git Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out successfully"
            }
        }

        // =============================================
        // Stage 2: Install Dependencies
        // =============================================
        stage('Install Dependencies') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh 'npm ci'
                }
                echo "✅ Dependencies installed"
            }
        }

        // =============================================
        // Stage 3: Run Unit Tests
        // =============================================
        stage('Unit Tests') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh 'npm run test -- --watch=false --code-coverage'
                }
            }
            post {
                always {
                    dir("${SERVICE_DIR}") {
                        publishHTML(target: [
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'coverage',
                            reportFiles: 'index.html',
                            reportName: 'Coverage Report'
                        ])
                    }
                }
            }
        }

        // =============================================
        // Stage 4: Build Angular Application
        // =============================================
        stage('Angular Build') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh 'npm run build -- --configuration=production'
                }
                echo "✅ Angular production build completed"
            }
        }

        // =============================================
        // Stage 5: SonarQube Code Quality Analysis
        // =============================================
        stage('SonarQube Analysis') {
            steps {
                dir("${SERVICE_DIR}") {
                    withSonarQubeEnv('SonarQube-Server') {
                        sh """
                            npx sonar-scanner \
                                -Dsonar.projectKey=certifypro-frontend \
                                -Dsonar.projectName='CertifyPro Frontend' \
                                -Dsonar.sources=src \
                                -Dsonar.exclusions=**/node_modules/**,**/*.spec.ts,**/dist/** \
                                -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
                echo "✅ SonarQube analysis completed"
            }
        }

        // =============================================
        // Stage 6: SonarQube Quality Gate
        // =============================================
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo "✅ Quality Gate passed"
            }
        }

        // =============================================
        // Stage 7: Build Docker Image
        // =============================================
        stage('Docker Build') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest ."
                }
                echo "✅ Docker image built: ${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }

        // =============================================
        // Stage 8: Push Docker Image to Registry
        // =============================================
        stage('Docker Push') {
            steps {
                sh """
                    echo \$DOCKER_HUB_CREDENTIALS_PSW | docker login -u \$DOCKER_HUB_CREDENTIALS_USR --password-stdin
                    docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    docker push ${DOCKER_IMAGE}:latest
                    docker logout
                """
                echo "✅ Docker image pushed to Docker Hub"
            }
        }
    }

    post {
        success {
            echo "🎉 CI Pipeline SUCCESS for frontend (Build #${BUILD_NUMBER})"
            // Trigger CD pipeline on success
            build job: 'CD-frontend', parameters: [
                string(name: 'DOCKER_TAG', value: "${DOCKER_TAG}")
            ], wait: false
        }
        failure {
            echo "❌ CI Pipeline FAILED for frontend (Build #${BUILD_NUMBER})"
        }
        always {
            // Clean up Docker images to save disk space
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            cleanWs()
        }
    }
}

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
                    sh 'npm test -- --watch=false --code-coverage'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner -Dproject.settings=${BACKEND_SONAR_CONFIG}
                        sonar-scanner -Dproject.settings=${FRONTEND_SONAR_CONFIG}
                    '''
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir(BACKEND_DIR) {
                    sh 'docker compose build'
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
                dir(BACKEND_DIR) {
                    sh 'docker compose up -d --build'
                }
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
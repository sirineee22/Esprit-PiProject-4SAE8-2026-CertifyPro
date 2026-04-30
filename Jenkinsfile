pipeline {
    agent any

    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        JWT_SECRET     = 'test-secret-min-32-chars-for-testing-only'
    }

    stages {

        // ─────────────────────────────────────────────────────────────
        // STAGE 1 — Checkout
        // ─────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo '✅ Code récupéré depuis GitHub'
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 2 — Tests job-careers-service
        // ─────────────────────────────────────────────────────────────
        stage('Test — job-careers-service') {
            steps {
                dir('backend/services/job-careers-service') {
                    withEnv([
                        'SPRING_DATASOURCE_URL=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1',
                        'SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver',
                        'SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.H2Dialect',
                        "JWT_SECRET=${env.JWT_SECRET}"
                    ]) {
                        sh 'chmod +x mvnw'
                        sh './mvnw test jacoco:report --no-transfer-progress'
                    }
                }
            }
            post {
                always {
                    junit 'backend/services/job-careers-service/target/surefire-reports/*.xml'
                    jacoco(
                        execPattern: 'backend/services/job-careers-service/target/jacoco.exec',
                        classPattern: 'backend/services/job-careers-service/target/classes',
                        sourcePattern: 'backend/services/job-careers-service/src/main/java'
                    )
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 3 — Tests messaging-service
        // ─────────────────────────────────────────────────────────────
        stage('Test — messaging-service') {
            steps {
                dir('backend/services/messanging-service') {
                    withEnv([
                        "JWT_SECRET=${env.JWT_SECRET}",
                        'SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/test_db'
                    ]) {
                        sh 'chmod +x mvnw'
                        sh './mvnw test jacoco:report --no-transfer-progress'
                    }
                }
            }
            post {
                always {
                    junit 'backend/services/messanging-service/target/surefire-reports/*.xml'
                    jacoco(
                        execPattern: 'backend/services/messanging-service/target/jacoco.exec',
                        classPattern: 'backend/services/messanging-service/target/classes',
                        sourcePattern: 'backend/services/messanging-service/src/main/java'
                    )
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 4 — SonarQube — job-careers-service
        // ─────────────────────────────────────────────────────────────
        stage('SonarQube — job-careers-service') {
            steps {
                dir('backend/services/job-careers-service') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            ./mvnw sonar:sonar \
                              -Dsonar.projectKey=job-careers-service \
                              -Dsonar.projectName="Job Careers Service" \
                              -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml \
                              --no-transfer-progress
                        '''
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 5 — SonarQube — messaging-service
        // ─────────────────────────────────────────────────────────────
        stage('SonarQube — messaging-service') {
            steps {
                dir('backend/services/messanging-service') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            ./mvnw sonar:sonar \
                              -Dsonar.projectKey=messanging-service \
                              -Dsonar.projectName="Messaging Service" \
                              -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml \
                              --no-transfer-progress
                        '''
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 6 — Build Docker — job-careers-service
        // ─────────────────────────────────────────────────────────────
        stage('Docker Build — job-careers-service') {
            steps {
                dir('backend/services/job-careers-service') {
                    sh './mvnw package -DskipTests --no-transfer-progress'
                    sh 'docker build -t job-careers-service:latest .'
                    echo '✅ Image Docker job-careers-service:latest construite'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 7 — Build Docker — messaging-service
        // ─────────────────────────────────────────────────────────────
        stage('Docker Build — messaging-service') {
            steps {
                dir('backend/services/messanging-service') {
                    sh './mvnw package -DskipTests --no-transfer-progress'
                    sh 'docker build -t messanging-service:latest .'
                    echo '✅ Image Docker messanging-service:latest construite'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 8 — Build Angular Frontend
        // ─────────────────────────────────────────────────────────────
        stage('Build — Angular Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npx ng build --configuration production'
                    echo '✅ Frontend Angular buildé en production'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 9 — Docker Build — Frontend
        // ─────────────────────────────────────────────────────────────
        stage('Docker Build — Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t certifypro-frontend:latest .'
                    echo '✅ Image Docker frontend:latest construite'
                }
            }
        }

    }

    // ─────────────────────────────────────────────────────────────────
    // POST — Notifications
    // ─────────────────────────────────────────────────────────────────
    post {
        success {
            echo '🎉 Pipeline terminé avec succès — tous les services sont buildés et testés'
        }
        failure {
            echo '❌ Pipeline échoué — vérifier les logs ci-dessus'
        }
        always {
            echo '📊 Rapports JUnit et JaCoCo disponibles dans Jenkins'
        }
    }
}

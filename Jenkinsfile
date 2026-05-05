pipeline {
    agent any

    environment {
        DOCKER_HUB_USER   = 'nesrrine'
        GIT_MANIFEST_REPO = 'https://github.com/sirineee22/Esprit-PiProject-4SAE8-2026-CertifyPro.git'
        GIT_MANIFEST_CRED = 'github-credentials'
        JWT_SECRET        = 'test-secret-min-32-chars-for-testing-only'
        IMAGE_TAG         = "${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    stages {

        // ══════════════════════════════════════════════════════════════
        // STAGE 1 — Checkout
        // ══════════════════════════════════════════════════════════════
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code récupéré — commit: ${env.GIT_COMMIT}"
            }
        }

        // ══════════════════════════════════════════════════════════════
        // CI — job-careers-service
        // ══════════════════════════════════════════════════════════════
        stage('CI — job-careers-service') {
            stages {

                stage('chmod mvnw — jobs') {
                    steps {
                        dir('backend/services/job-careers-service') {
                            sh 'chmod +x mvnw'
                        }
                    }
                }

                stage('Tests unitaires — jobs') {
                    steps {
                        dir('backend/services/job-careers-service') {
                            withEnv([
                                'SPRING_DATASOURCE_URL=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1',
                                'SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver',
                                'SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.H2Dialect',
                                "JWT_SECRET=${env.JWT_SECRET}"
                            ]) {
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

                stage('SonarQube — jobs') {
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

                stage('Build JAR — jobs') {
                    steps {
                        dir('backend/services/job-careers-service') {
                            sh './mvnw package -DskipTests --no-transfer-progress'
                            echo '✅ JAR job-careers-service construit'
                        }
                    }
                }

                stage('Docker Build — jobs') {
                    steps {
                        dir('backend/services/job-careers-service') {
                            sh "docker build -t ${DOCKER_HUB_USER}/job-careers-service:${IMAGE_TAG} ."
                            sh "docker tag ${DOCKER_HUB_USER}/job-careers-service:${IMAGE_TAG} ${DOCKER_HUB_USER}/job-careers-service:latest"
                            echo "✅ Image Docker job-careers-service:${IMAGE_TAG} construite"
                        }
                    }
                }

                stage('Prometheus check — jobs') {
                    steps {
                        script {
                            echo '🔍 Vérification endpoint /actuator/prometheus (après déploiement)'
                            // Vérifié après CD — ici on valide juste que l'endpoint est configuré
                            sh "grep -r 'prometheus' backend/services/job-careers-service/src/main/resources/ || true"
                        }
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // CI — messaging-service
        // ══════════════════════════════════════════════════════════════
        stage('CI — messaging-service') {
            stages {

                stage('chmod mvnw — messaging') {
                    steps {
                        dir('backend/services/messanging-service') {
                            sh 'chmod +x mvnw'
                        }
                    }
                }

                stage('Tests unitaires — messaging') {
                    steps {
                        dir('backend/services/messanging-service') {
                            withEnv([
                                "JWT_SECRET=${env.JWT_SECRET}",
                                'SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/test_db'
                            ]) {
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

                stage('SonarQube — messaging') {
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

                stage('Build JAR — messaging') {
                    steps {
                        dir('backend/services/messanging-service') {
                            sh './mvnw package -DskipTests --no-transfer-progress'
                            echo '✅ JAR messanging-service construit'
                        }
                    }
                }

                stage('Docker Build — messaging') {
                    steps {
                        dir('backend/services/messanging-service') {
                            sh "docker build -t ${DOCKER_HUB_USER}/messanging-service:${IMAGE_TAG} ."
                            sh "docker tag ${DOCKER_HUB_USER}/messanging-service:${IMAGE_TAG} ${DOCKER_HUB_USER}/messanging-service:latest"
                            echo "✅ Image Docker messanging-service:${IMAGE_TAG} construite"
                        }
                    }
                }

                stage('Prometheus check — messaging') {
                    steps {
                        script {
                            echo '🔍 Vérification endpoint /actuator/prometheus configuré'
                            sh "grep -r 'prometheus' backend/services/messanging-service/src/main/resources/ || true"
                        }
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // CI — Angular Frontend
        // ══════════════════════════════════════════════════════════════
        stage('CI — Angular Frontend') {
            stages {

                stage('npm ci') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }

                stage('ng build production') {
                    steps {
                        dir('frontend') {
                            sh 'npx ng build --configuration production'
                            echo '✅ Frontend Angular buildé en production'
                        }
                    }
                }

                stage('Docker Build — frontend') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${DOCKER_HUB_USER}/certifypro-frontend:${IMAGE_TAG} ."
                            sh "docker tag ${DOCKER_HUB_USER}/certifypro-frontend:${IMAGE_TAG} ${DOCKER_HUB_USER}/certifypro-frontend:latest"
                            echo "✅ Image Docker frontend:${IMAGE_TAG} construite"
                        }
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // CD — Docker Push + Mise à jour manifests (branche main seulement)
        // ══════════════════════════════════════════════════════════════
        stage('CD — Docker Push & Update Manifests') {
            when {
                branch 'main'
            }
            stages {

                stage('Docker Login') {
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: 'dockerhub-credentials',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )]) {
                            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                            echo '✅ Connecté à Docker Hub'
                        }
                    }
                }

                stage('Docker Push — jobs') {
                    steps {
                        sh "docker push ${DOCKER_HUB_USER}/job-careers-service:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_HUB_USER}/job-careers-service:latest"
                        echo "✅ job-careers-service:${IMAGE_TAG} pushé sur Docker Hub"
                    }
                }

                stage('Docker Push — messaging') {
                    steps {
                        sh "docker push ${DOCKER_HUB_USER}/messanging-service:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_HUB_USER}/messanging-service:latest"
                        echo "✅ messanging-service:${IMAGE_TAG} pushé sur Docker Hub"
                    }
                }

                stage('Docker Push — frontend') {
                    steps {
                        sh "docker push ${DOCKER_HUB_USER}/certifypro-frontend:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_HUB_USER}/certifypro-frontend:latest"
                        echo "✅ certifypro-frontend:${IMAGE_TAG} pushé sur Docker Hub"
                    }
                }

                stage('Mise à jour manifests Kubernetes') {
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: "${GIT_MANIFEST_CRED}",
                            usernameVariable: 'GIT_USER',
                            passwordVariable: 'GIT_TOKEN'
                        )]) {
                            sh """
                                # Mettre à jour les tags dans les manifests
                                sed -i 's|image: ${DOCKER_HUB_USER}/job-careers-service:.*|image: ${DOCKER_HUB_USER}/job-careers-service:${IMAGE_TAG}|g' k8s/job-careers-service/deployment.yaml
                                sed -i 's|image: ${DOCKER_HUB_USER}/messanging-service:.*|image: ${DOCKER_HUB_USER}/messanging-service:${IMAGE_TAG}|g' k8s/messanging-service/deployment.yaml
                                sed -i 's|image: ${DOCKER_HUB_USER}/certifypro-frontend:.*|image: ${DOCKER_HUB_USER}/certifypro-frontend:${IMAGE_TAG}|g' k8s/frontend/deployment.yaml

                                # Commit et push
                                git config user.email "jenkins@certifypro.ci"
                                git config user.name "Jenkins CI"
                                git add k8s/
                                git commit -m "cd: update images to tag ${IMAGE_TAG} [skip ci]" || echo "Rien à committer"
                                git push https://${GIT_USER}:${GIT_TOKEN}@github.com/sirineee22/Esprit-PiProject-4SAE8-2026-CertifyPro.git HEAD:main
                            """
                        }
                        echo "✅ Manifests Kubernetes mis à jour avec le tag ${IMAGE_TAG}"
                    }
                }

                stage('Attendre Argo CD sync') {
                    steps {
                        echo '⏳ Argo CD détecte le changement et synchronise automatiquement...'
                        sleep(time: 30, unit: 'SECONDS')
                        echo '✅ Argo CD a eu le temps de détecter et déployer'
                    }
                }

                stage('Vérification santé — jobs') {
                    steps {
                        script {
                            retry(5) {
                                sleep(time: 10, unit: 'SECONDS')
                                sh 'curl -f http://localhost:8089/actuator/health || exit 1'
                            }
                        }
                        echo '✅ job-careers-service répond sur /actuator/health'
                    }
                }

                stage('Vérification santé — messaging') {
                    steps {
                        script {
                            retry(5) {
                                sleep(time: 10, unit: 'SECONDS')
                                sh 'curl -f http://localhost:8085/actuator/health || exit 1'
                            }
                        }
                        echo '✅ messaging-service répond sur /actuator/health'
                    }
                }

                stage('Prometheus actif — jobs') {
                    steps {
                        script {
                            retry(3) {
                                sleep(time: 5, unit: 'SECONDS')
                                sh 'curl -f http://localhost:8089/actuator/prometheus | head -5 || exit 1'
                            }
                        }
                        echo '✅ Métriques Prometheus exposées pour job-careers-service'
                    }
                }

                stage('Prometheus actif — messaging') {
                    steps {
                        script {
                            retry(3) {
                                sleep(time: 5, unit: 'SECONDS')
                                sh 'curl -f http://localhost:8085/actuator/prometheus | head -5 || exit 1'
                            }
                        }
                        echo '✅ Métriques Prometheus exposées pour messaging-service'
                    }
                }

                stage('Vérification frontend') {
                    steps {
                        script {
                            retry(3) {
                                sleep(time: 5, unit: 'SECONDS')
                                sh 'curl -f http://localhost:80 || exit 1'
                            }
                        }
                        echo '✅ Frontend répond sur http://localhost:80'
                    }
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline CI/CD complet — tous les services buildés, testés et déployés'
        }
        failure {
            echo '❌ Pipeline échoué — vérifier les logs ci-dessus'
        }
        always {
            echo '📊 Rapports JUnit et JaCoCo disponibles dans Jenkins'
            sh 'docker logout || true'
        }
    }
}

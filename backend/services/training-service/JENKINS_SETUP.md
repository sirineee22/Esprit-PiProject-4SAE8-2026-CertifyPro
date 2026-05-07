# 🚀 Configuration Jenkins + SonarQube pour Training Service

## 📋 Prérequis

✅ Docker installé et en cours d'exécution  
✅ Jenkins en cours d'exécution sur `http://localhost:9090`  
✅ SonarQube en cours d'exécution sur `http://localhost:9000`  
✅ Compte Docker Hub : `khalil373`

---

## 🔧 Étape 1 : Configuration de SonarQube

### 1.1 Accéder à SonarQube

Attends que SonarQube soit complètement démarré (ça peut prendre 2-3 minutes), puis :

```bash
# Vérifier que SonarQube est prêt
docker logs sonarqube
```

Quand tu vois `SonarQube is operational`, ouvre :
```
http://localhost:9000
```

### 1.2 Connexion initiale

- **Username:** `admin`
- **Password:** `admin`
- Tu seras invité à changer le mot de passe → choisis un nouveau mot de passe

### 1.3 Créer un Token SonarQube

1. Va sur **Administration → Security → Users**
2. Clique sur les 3 points à côté de `admin` → **Update Tokens**
3. Crée un nouveau token :
   - **Name:** `jenkins-token`
   - **Type:** `Global Analysis Token`
   - **Expires in:** `No expiration`
4. Clique **Generate**
5. **⚠️ COPIE LE TOKEN** (tu ne pourras plus le voir après) :
   ```
   Exemple: squ_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
   ```

---

## 🔧 Étape 2 : Configuration de Jenkins

### 2.1 Installer les plugins Jenkins

Va sur Jenkins : `http://localhost:9090`

1. **Manage Jenkins → Plugins → Available plugins**
2. Cherche et installe ces plugins :
   - ✅ **SonarQube Scanner**
   - ✅ **JaCoCo**
   - ✅ **Docker Pipeline**
   - ✅ **Docker Commons**
   - ✅ **Email Extension Plugin** (pour les notifications)
3. Coche **"Restart Jenkins when installation is complete"**

### 2.2 Configurer Maven et JDK

**Manage Jenkins → Tools**

#### Maven Configuration
- Clique **Add Maven**
- **Name:** `Maven-3.9`
- **Version:** `3.9.6` (ou la dernière version)
- Coche **Install automatically**
- Sauvegarde

#### JDK Configuration
- Clique **Add JDK**
- **Name:** `JDK-17`
- **Version:** `17` (Eclipse Temurin)
- Coche **Install automatically**
- Sauvegarde

### 2.3 Configurer SonarQube Server

**Manage Jenkins → System → SonarQube servers**

1. Coche **Enable injection of SonarQube server configuration**
2. Clique **Add SonarQube**
3. Configure :
   - **Name:** `SonarQube-Local`
   - **Server URL:** `http://sonarqube:9000`
   - **Server authentication token:** Clique **Add → Jenkins**
     - **Kind:** `Secret text`
     - **Secret:** Colle ton token SonarQube (celui que tu as copié)
     - **ID:** `sonarqube-token`
     - **Description:** `SonarQube Token`
     - Clique **Add**
   - Sélectionne le token que tu viens de créer
4. Sauvegarde

### 2.4 Configurer Docker Hub Credentials

**Manage Jenkins → Credentials → System → Global credentials**

1. Clique **Add Credentials**
2. Configure :
   - **Kind:** `Username with password`
   - **Username:** `khalil373`
   - **Password:** `[ton mot de passe Docker Hub]`
   - **ID:** `dockerhub-credentials`
   - **Description:** `Docker Hub - khalil373`
3. Clique **Create**

### 2.5 Configurer Email (optionnel)

**Manage Jenkins → System → Extended E-mail Notification**

Configure ton serveur SMTP (Gmail, Outlook, etc.)

---

## 🚀 Étape 3 : Créer le Pipeline Jenkins

### 3.1 Créer un nouveau Job

1. Sur Jenkins, clique **New Item**
2. Configure :
   - **Name:** `training-service-pipeline`
   - **Type:** `Pipeline`
   - Clique **OK**

### 3.2 Configurer le Pipeline

Dans la configuration du job :

#### General
- **Description:** `CI/CD Pipeline for Training Service with SonarQube and JaCoCo`
- Coche **GitHub project** (si tu utilises GitHub)
  - **Project url:** `https://github.com/ton-username/ton-repo`

#### Build Triggers
- Coche **Poll SCM** (pour vérifier les changements)
  - **Schedule:** `H/5 * * * *` (vérifie toutes les 5 minutes)
- OU coche **GitHub hook trigger** (si tu as configuré un webhook)

#### Pipeline
- **Definition:** `Pipeline script from SCM`
- **SCM:** `Git`
- **Repository URL:** `https://github.com/ton-username/ton-repo.git`
- **Credentials:** Ajoute tes credentials GitHub si nécessaire
- **Branch:** `*/main` (ou `*/master`)
- **Script Path:** `backend/services/training-service/Jenkinsfile`

Clique **Save**

---

## ▶️ Étape 4 : Lancer le Pipeline

### 4.1 Premier Build

1. Sur la page du job, clique **Build Now**
2. Regarde le build en cours dans **Build History**
3. Clique sur le numéro du build → **Console Output** pour voir les logs

### 4.2 Vérifier les résultats

#### Jenkins Dashboard
- **Test Results:** Voir les résultats des tests unitaires
- **JaCoCo Coverage:** Voir le rapport de couverture de code
- **Build Status:** ✅ Success ou ❌ Failure

#### SonarQube Dashboard
Va sur `http://localhost:9000/dashboard?id=training-service`

Tu verras :
- **Bugs** 🐛
- **Vulnerabilities** 🔒
- **Code Smells** 👃
- **Coverage** 📊
- **Duplications** 📋
- **Security Hotspots** 🔥

#### Docker Hub
Va sur `https://hub.docker.com/r/khalil373/training-service`

Tu verras ton image Docker avec les tags :
- `latest`
- `1`, `2`, `3`, etc. (numéros de build)

---

## 📊 Étape 5 : Comprendre le Pipeline

Le pipeline exécute ces étapes :

1. **Checkout** 📥 : Clone le code depuis Git
2. **Build** 🔨 : Compile le code avec Maven
3. **Unit Tests** 🧪 : Exécute les tests unitaires
4. **Code Coverage** 📊 : Génère le rapport JaCoCo
5. **SonarQube Analysis** 🔍 : Analyse la qualité du code
6. **Quality Gate** 🚦 : Vérifie si le code passe les critères de qualité
7. **Package** 📦 : Crée le fichier JAR
8. **Build Docker Image** 🐳 : Crée l'image Docker
9. **Push to Docker Hub** 📤 : Pousse l'image sur Docker Hub
10. **Clean** 🧹 : Nettoie les images locales

---

## 🔍 Étape 6 : Configurer Quality Gate dans SonarQube

### 6.1 Créer un Quality Gate personnalisé

1. Va sur SonarQube → **Quality Gates**
2. Clique **Create**
3. **Name:** `CertifyPro-Standards`
4. Ajoute ces conditions :

| Metric | Operator | Value |
|--------|----------|-------|
| Coverage | is less than | 80% |
| Duplicated Lines (%) | is greater than | 3% |
| Maintainability Rating | is worse than | A |
| Reliability Rating | is worse than | A |
| Security Rating | is worse than | A |

5. Sauvegarde

### 6.2 Appliquer le Quality Gate au projet

1. Va sur **Projects → training-service**
2. **Project Settings → Quality Gate**
3. Sélectionne `CertifyPro-Standards`
4. Sauvegarde

---

## 🐛 Dépannage

### SonarQube ne démarre pas
```bash
# Vérifier les logs
docker logs sonarqube

# Redémarrer
docker restart sonarqube
```

### Jenkins ne peut pas se connecter à SonarQube
- Vérifie que les deux conteneurs sont sur le même réseau : `certifypro-net`
- Utilise `http://sonarqube:9000` (nom du conteneur) et non `http://localhost:9000`

### Le build échoue à l'étape Docker
```bash
# Vérifier que Docker est accessible depuis Jenkins
docker exec -it jenkins docker ps
```

Si ça ne marche pas, tu dois monter le socket Docker :
```bash
docker stop jenkins
docker rm jenkins
docker run -d \
  --name jenkins \
  --network certifypro-net \
  -p 9090:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17
```

### Quality Gate échoue
- Va sur SonarQube pour voir les problèmes détectés
- Corrige les bugs, vulnérabilités ou améliore la couverture de tests
- Relance le build

---

## 📈 Métriques à surveiller

### JaCoCo Coverage
- **Objectif:** > 80%
- **Localisation:** Jenkins → Job → JaCoCo Coverage

### SonarQube Metrics
- **Bugs:** 0
- **Vulnerabilities:** 0
- **Code Smells:** < 10
- **Technical Debt:** < 1 jour
- **Duplications:** < 3%

---

## 🎯 Prochaines étapes

1. ✅ Ajouter plus de tests unitaires pour augmenter la couverture
2. ✅ Configurer des webhooks GitHub pour déclencher automatiquement les builds
3. ✅ Ajouter des tests d'intégration
4. ✅ Configurer le déploiement automatique (CD)
5. ✅ Ajouter des notifications Slack/Discord

---

## 📚 Ressources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)
- [Docker Hub](https://hub.docker.com/)

---

**✨ Bon build ! 🚀**

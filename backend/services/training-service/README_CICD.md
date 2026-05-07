# 🚀 CI/CD Pipeline - Training Service

## ✅ État actuel

- ✅ **Jenkins** : http://localhost:9090 (opérationnel)
- ✅ **SonarQube** : http://localhost:9000 (opérationnel)
- ✅ **Jenkinsfile** : Créé et prêt
- ✅ **JaCoCo** : Configuré dans pom.xml
- ✅ **Docker Hub** : khalil373/training-service

---

## 📁 Fichiers créés

```
training-service/
├── Jenkinsfile              # Pipeline CI/CD complet
├── QUICK_START.md           # Guide rapide (10 min)
├── JENKINS_SETUP.md         # Guide détaillé complet
├── check-setup.ps1          # Script de vérification
└── README_CICD.md           # Ce fichier
```

---

## 🎯 Prochaines étapes (dans l'ordre)

### 1. Configure SonarQube (2 min)

Ouvre http://localhost:9000

- Login: `admin` / `admin`
- Change le mot de passe
- Crée un token : **Administration → Security → Users → Update Tokens**
- Copie le token (tu en auras besoin pour Jenkins)

### 2. Configure Jenkins (5 min)

Ouvre http://localhost:9090

#### A. Installe les plugins
`Manage Jenkins → Plugins → Available`
- SonarQube Scanner
- JaCoCo
- Docker Pipeline
- Docker Commons

#### B. Configure les outils
`Manage Jenkins → Tools`
- Maven: `Maven-3.9` (install automatically)
- JDK: `JDK-17` (install automatically)

#### C. Configure SonarQube
`Manage Jenkins → System → SonarQube servers`
- Name: `SonarQube-Local`
- URL: `http://sonarqube:9000`
- Token: Ajoute ton token SonarQube

#### D. Configure Docker Hub
`Manage Jenkins → Credentials`
- Username: `khalil373`
- Password: [ton mot de passe]
- ID: `dockerhub-credentials`

### 3. Crée le Pipeline (2 min)

`New Item → Pipeline`
- Name: `training-service-pipeline`
- Pipeline from SCM → Git
- Script Path: `backend/services/training-service/Jenkinsfile`

### 4. Lance le build ! 🚀

Clique **Build Now** et regarde la magie opérer !

---

## 📊 Ce que fait le pipeline

```
1. Checkout          → Clone le code
2. Build             → Compile avec Maven
3. Unit Tests        → Exécute les tests
4. Code Coverage     → Génère le rapport JaCoCo
5. SonarQube         → Analyse la qualité du code
6. Quality Gate      → Vérifie les critères de qualité
7. Package           → Crée le JAR
8. Docker Build      → Crée l'image Docker
9. Docker Push       → Pousse sur Docker Hub
10. Clean            → Nettoie les images locales
```

---

## 🔍 Vérifier les résultats

### Jenkins
- **Tests** : Résultats des tests unitaires
- **JaCoCo** : Couverture de code (objectif: >80%)
- **Build History** : Historique des builds

### SonarQube
- **Bugs** : Erreurs dans le code
- **Vulnerabilities** : Failles de sécurité
- **Code Smells** : Mauvaises pratiques
- **Coverage** : Couverture de tests
- **Duplications** : Code dupliqué

### Docker Hub
- **Images** : `khalil373/training-service:latest`
- **Tags** : 1, 2, 3... (numéros de build)

---

## 🛠️ Commandes utiles

### Vérifier l'état
```powershell
.\check-setup.ps1
```

### Voir les logs
```bash
docker logs jenkins
docker logs sonarqube
```

### Redémarrer un service
```bash
docker restart jenkins
docker restart sonarqube
```

### Arrêter tout
```bash
docker stop jenkins sonarqube
```

### Tout supprimer (attention !)
```bash
docker stop jenkins sonarqube
docker rm jenkins sonarqube
docker volume rm jenkins_home
```

---

## 📚 Documentation

- **Guide rapide** : `QUICK_START.md` (10 minutes)
- **Guide complet** : `JENKINS_SETUP.md` (détails complets)
- **Jenkinsfile** : Pipeline CI/CD commenté

---

## 🐛 Problèmes courants

### SonarQube ne démarre pas
```bash
docker logs sonarqube
# Attends "SonarQube is operational"
```

### Jenkins ne peut pas se connecter à SonarQube
- Vérifie que les deux sont sur le réseau `certifypro-net`
- Utilise `http://sonarqube:9000` (pas localhost)

### Docker command not found dans Jenkins
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
C'est normal au début ! Va sur SonarQube pour voir les problèmes et les corriger.

---

## 🎓 Métriques de qualité

### Objectifs
- **Coverage** : > 80%
- **Bugs** : 0
- **Vulnerabilities** : 0
- **Code Smells** : < 10
- **Duplications** : < 3%
- **Maintainability** : A
- **Reliability** : A
- **Security** : A

---

## 🚀 Workflow de développement

1. **Développe** une nouvelle feature
2. **Commit & Push** sur GitHub
3. **Jenkins** détecte le changement
4. **Pipeline** s'exécute automatiquement
5. **SonarQube** analyse le code
6. **Quality Gate** valide ou rejette
7. **Docker Hub** reçoit la nouvelle image
8. **Notification** par email

---

## 📧 Notifications

Le pipeline envoie des emails :
- ✅ **Success** : Build réussi avec lien vers SonarQube
- ❌ **Failure** : Build échoué avec lien vers les logs

Configure ton serveur SMTP dans Jenkins pour activer les notifications.

---

## 🎉 C'est tout !

Tu as maintenant un pipeline CI/CD complet avec :
- ✅ Tests automatiques
- ✅ Analyse de qualité de code
- ✅ Couverture de code
- ✅ Build Docker automatique
- ✅ Déploiement sur Docker Hub

**Bon build ! 🚀**

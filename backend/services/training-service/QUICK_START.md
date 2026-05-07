# ⚡ Guide Rapide - Configuration en 10 minutes

## ✅ Ce qui est déjà fait

- ✅ Jenkins tourne sur `http://localhost:9090`
- ✅ SonarQube tourne sur `http://localhost:9000`
- ✅ Jenkinsfile créé
- ✅ JaCoCo configuré dans pom.xml

---

## 🚀 À faire MAINTENANT (dans l'ordre)

### 1️⃣ Configurer SonarQube (5 min)

```bash
# Ouvre SonarQube
http://localhost:9000
```

**Connexion :**
- Username: `admin`
- Password: `admin`
- Change le mot de passe quand demandé

**Créer un token :**
1. **Administration → Security → Users**
2. Clique sur les 3 points → **Update Tokens**
3. **Name:** `jenkins-token`
4. **Type:** `Global Analysis Token`
5. Clique **Generate**
6. **⚠️ COPIE LE TOKEN** (exemple: `squ_abc123...`)

---

### 2️⃣ Installer les plugins Jenkins (3 min)

```bash
# Ouvre Jenkins
http://localhost:9090/manage/pluginManager/available
```

**Cherche et installe :**
- ✅ SonarQube Scanner
- ✅ JaCoCo
- ✅ Docker Pipeline
- ✅ Docker Commons

Coche **"Restart Jenkins when installation is complete"**

---

### 3️⃣ Configurer Jenkins (2 min)

#### A. Configurer Maven et JDK

`http://localhost:9090/manage/configureTools/`

**Maven :**
- Clique **Add Maven**
- Name: `Maven-3.9`
- Coche **Install automatically**
- Sauvegarde

**JDK :**
- Clique **Add JDK**
- Name: `JDK-17`
- Coche **Install automatically**
- Sauvegarde

#### B. Configurer SonarQube

`http://localhost:9090/manage/configure`

Cherche **SonarQube servers** :
1. Coche **Enable injection of SonarQube server configuration**
2. Clique **Add SonarQube**
3. **Name:** `SonarQube-Local`
4. **Server URL:** `http://sonarqube:9000`
5. **Server authentication token:**
   - Clique **Add → Jenkins**
   - **Kind:** `Secret text`
   - **Secret:** Colle ton token SonarQube
   - **ID:** `sonarqube-token`
   - Clique **Add**
   - Sélectionne le token
6. Sauvegarde

#### C. Configurer Docker Hub

`http://localhost:9090/manage/credentials/store/system/domain/_/`

1. Clique **Add Credentials**
2. **Kind:** `Username with password`
3. **Username:** `khalil373`
4. **Password:** `[ton mot de passe Docker Hub]`
5. **ID:** `dockerhub-credentials`
6. Clique **Create**

---

### 4️⃣ Créer le Pipeline Jenkins (2 min)

`http://localhost:9090/view/all/newJob`

1. **Name:** `training-service-pipeline`
2. **Type:** `Pipeline`
3. Clique **OK**

**Configuration :**
- **Pipeline → Definition:** `Pipeline script from SCM`
- **SCM:** `Git`
- **Repository URL:** `[URL de ton repo GitHub]`
- **Branch:** `*/main`
- **Script Path:** `backend/services/training-service/Jenkinsfile`
- Sauvegarde

---

### 5️⃣ Lancer le premier build ! 🚀

1. Va sur le job : `http://localhost:9090/job/training-service-pipeline/`
2. Clique **Build Now**
3. Regarde les logs : Clique sur le numéro du build → **Console Output**

---

## 📊 Vérifier les résultats

### Jenkins
```
http://localhost:9090/job/training-service-pipeline/
```
- Test Results
- JaCoCo Coverage
- Build History

### SonarQube
```
http://localhost:9000/dashboard?id=training-service
```
- Bugs
- Vulnerabilities
- Code Coverage
- Code Smells

### Docker Hub
```
https://hub.docker.com/r/khalil373/training-service
```
- Images avec tags (latest, 1, 2, 3...)

---

## 🐛 Problèmes courants

### "Cannot connect to SonarQube"
```bash
# Vérifie que SonarQube est prêt
docker logs sonarqube

# Attends de voir "SonarQube is operational"
```

### "Docker command not found in Jenkins"
```bash
# Redémarre Jenkins avec le socket Docker
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

### "Quality Gate failed"
C'est normal au début ! Va sur SonarQube pour voir ce qui doit être corrigé.

---

## 📝 Checklist finale

- [ ] SonarQube accessible sur http://localhost:9000
- [ ] Token SonarQube créé et copié
- [ ] Plugins Jenkins installés
- [ ] Maven et JDK configurés dans Jenkins
- [ ] SonarQube server configuré dans Jenkins
- [ ] Docker Hub credentials ajoutés
- [ ] Pipeline créé dans Jenkins
- [ ] Premier build lancé avec succès ✅

---

**🎉 C'est tout ! Ton pipeline CI/CD est prêt !**

Pour plus de détails, consulte `JENKINS_SETUP.md`

# 🧪 Guide de Test - Communication Inter-Microservices

## 📋 Objectif

Tester la création d'un **Post** dans le Forum Service avec validation automatique du `userId` via le User Service.

---

## ✅ Prérequis - Démarrer tous les services

### Ordre de démarrage (IMPORTANT)

```powershell
# Terminal 1: Eureka Discovery Server
cd backend\discovery-server
mvn spring-boot:run

# Terminal 2: API Gateway (ATTENDRE que Eureka soit démarré)
cd backend\api-gateway
mvn spring-boot:run

# Terminal 3: User Service (ATTENDRE que Gateway soit démarré)
cd backend\services\user-service
mvn spring-boot:run

# Terminal 4: Forum Service (ATTENDRE que User Service soit démarré)
cd backend\services\forum_service
mvn spring-boot:run
```

### ⏱️ Temps d'attente
- **Eureka** : 30 secondes
- **API Gateway** : 30 secondes après Eureka
- **User Service** : 30-60 secondes après Gateway
- **Forum Service** : 30 secondes après User Service

---

## 🔍 Étape 1 : Vérifier que tous les services sont démarrés

### 1.1 Vérifier Eureka Dashboard
Ouvrir : http://localhost:8761

**Vérifier que vous voyez :**
- ✅ `API-GATEWAY`
- ✅ `USER-SERVICE`
- ✅ `FORUM-SERVICE`

### 1.2 Test rapide des services

**User Service (direct) :**
```bash
curl http://localhost:8083/api/users
```

**User Service (via Gateway) :**
```bash
curl http://localhost:8081/api/users
```

**Forum Service :**
```bash
curl http://localhost:8084/api/forum/posts
```

---

## 👤 Étape 2 : Créer un utilisateur dans User Service

### 2.1 Créer un utilisateur

**Via Postman ou curl :**

```bash
POST http://localhost:8081/api/users
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!",
  "active": true
}
```

**Réponse attendue :**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "active": true,
  ...
}
```

**⚠️ IMPORTANT : Notez l'`id` retourné (ex: `1`)**

### 2.2 Vérifier que l'utilisateur existe

```bash
GET http://localhost:8081/api/users/1
```

**Réponse attendue :**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "active": true
}
```

---

## 📝 Étape 3 : Tester la création d'un Post avec userId valide

### 3.1 Créer un Post avec userId valide

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json

{
  "userId": 1,
  "title": "Mon premier post avec validation inter-microservices",
  "content": "Ce post a été créé avec validation automatique du userId via le User Service !"
}
```

**Réponse attendue (200 OK) :**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Mon premier post avec validation inter-microservices",
  "content": "Ce post a été créé avec validation automatique du userId via le User Service !",
  "createdAt": "2024-02-18T22:35:00.123456"
}
```

### 3.2 Vérifier les logs du Forum Service

Dans le terminal du Forum Service, vous devriez voir :
```
INFO  UserServiceClient - Communication inter-microservices réussie: User 1 existe, actif: true
```

### 3.3 Vérifier les logs de l'API Gateway

Dans le terminal de l'API Gateway, vous devriez voir :
```
GET /api/users/1
```

---

## ❌ Étape 4 : Tester avec userId invalide (validation)

### 4.1 Créer un Post avec userId inexistant

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json

{
  "userId": 999,
  "title": "Test avec userId invalide",
  "content": "Ce post ne devrait pas être créé"
}
```

**Réponse attendue (400 Bad Request) :**
```json
"User with ID 999 does not exist or is not active"
```

### 4.2 Vérifier les logs

Dans le terminal du Forum Service :
```
WARN  UserServiceClient - User 999 n'existe pas dans le user-service
```

---

## 🔄 Étape 5 : Tester le flux complet

### Scénario complet :

1. **Créer un utilisateur** dans User Service
   ```bash
   POST http://localhost:8081/api/users
   {
     "firstName": "Jane",
     "lastName": "Smith",
     "email": "jane.smith@example.com",
     "password": "Password123!",
     "active": true
   }
   ```
   → Notez l'ID (ex: `2`)

2. **Créer un Post** avec cet utilisateur
   ```bash
   POST http://localhost:8084/api/forum/posts
   {
     "userId": 2,
     "title": "Post de Jane",
     "content": "Contenu du post"
   }
   ```
   → Devrait fonctionner ✅

3. **Créer un Comment** sur ce Post
   ```bash
   POST http://localhost:8084/api/forum/posts/1/comments
   {
     "userId": 2,
     "content": "Commentaire de Jane"
   }
   ```
   → Devrait fonctionner ✅

4. **Tester avec userId invalide**
   ```bash
   POST http://localhost:8084/api/forum/posts
   {
     "userId": 999,
     "title": "Test",
     "content": "Test"
   }
   ```
   → Devrait retourner 400 ❌

---

## 📊 Vérification de la communication inter-microservices

### Dans les logs du Forum Service :

```
INFO  UserServiceClient - Communication inter-microservices réussie: User 1 existe, actif: true
```

### Dans les logs de l'API Gateway :

Vous devriez voir les requêtes routées :
```
GET /api/users/1 → lb://USER-SERVICE
```

### Dans les logs du User Service :

Vous devriez voir les requêtes reçues :
```
GET /api/users/1
```

---

## 🎯 Test avec Postman

### Collection Postman

1. **Créer un utilisateur**
   - Method: `POST`
   - URL: `http://localhost:8081/api/users`
   - Body:
   ```json
   {
     "firstName": "Test",
     "lastName": "User",
     "email": "test@example.com",
     "password": "Password123!",
     "active": true
   }
   ```
   - Notez l'`id` retourné

2. **Créer un Post**
   - Method: `POST`
   - URL: `http://localhost:8084/api/forum/posts`
   - Body:
   ```json
   {
     "userId": 1,
     "title": "Test Post",
     "content": "Contenu du test"
   }
   ```

3. **Vérifier le Post créé**
   - Method: `GET`
   - URL: `http://localhost:8084/api/forum/posts`

---

## 🐛 Dépannage

### Problème : "Connection refused" vers API Gateway

**Solution :**
- Vérifier que l'API Gateway est démarré (port 8081)
- Tester : `curl http://localhost:8081/api/users`

### Problème : "User with ID X does not exist"

**Solution :**
- Vérifier que l'utilisateur existe : `curl http://localhost:8081/api/users/X`
- Vérifier que `active = true` pour l'utilisateur

### Problème : Pas de logs de communication

**Solution :**
- Vérifier que tous les services sont démarrés
- Vérifier que Forum Service peut accéder à l'API Gateway
- Vérifier les logs de chaque service

### Problème : Services non visibles dans Eureka

**Solution :**
- Attendre 30-60 secondes après le démarrage
- Vérifier que chaque service a `eureka.client.register-with-eureka=true`
- Redémarrer les services dans l'ordre

---

## ✅ Checklist de test

- [ ] Eureka démarré et accessible (http://localhost:8761)
- [ ] API Gateway démarré et accessible (http://localhost:8081)
- [ ] User Service démarré et enregistré dans Eureka
- [ ] Forum Service démarré et enregistré dans Eureka
- [ ] Utilisateur créé dans User Service
- [ ] Test création Post avec userId valide → ✅ Succès
- [ ] Test création Post avec userId invalide → ❌ Erreur 400
- [ ] Logs montrent la communication inter-microservices

---

## 📝 Résumé

**Ce que vous avez testé :**
1. ✅ Communication inter-microservices : Forum Service → API Gateway → User Service
2. ✅ Validation automatique des userId avant création de posts
3. ✅ Gestion des erreurs (userId invalide)
4. ✅ Architecture découplée via API Gateway

**Architecture testée :**
```
Client → Forum Service → API Gateway → User Service
         (Port 8084)    (Port 8081)   (Port 8083)
```

Tout fonctionne ! 🎉


# 🔐 Guide de Test - Communication Inter-Microservices avec JWT

## 📋 Objectif

Tester la création d'un **Post** dans le Forum Service avec :
1. ✅ Authentification JWT (token généré lors du login)
2. ✅ Validation automatique du `userId` via le User Service
3. ✅ Communication sécurisée inter-microservices

---

## 🔑 Étape 1 : Obtenir le Token JWT (Login)

### 1.1 Se connecter pour obtenir le token

**Requête :**
```bash
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "Admin123!"
}
```

**Réponse attendue (200 OK) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@platform.com",
    "active": true,
    ...
  }
}
```

**⚠️ IMPORTANT : Copier le `token` retourné !**

---

## 📝 Étape 2 : Créer un Post avec le Token JWT

### 2.1 Créer un Post avec authentification

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "userId": 1,
  "title": "Mon premier post avec JWT",
  "content": "Ce post utilise le token JWT pour l'authentification inter-microservices"
}
```

**Réponse attendue (200 OK) :**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Mon premier post avec JWT",
  "content": "Ce post utilise le token JWT pour l'authentification inter-microservices",
  "createdAt": "2024-02-18T22:40:00.123456"
}
```

---

## 🔄 Flux Complet avec JWT

```
1. Client → Login → User Service
   ↓ Retourne JWT Token

2. Client → Créer Post (avec Token dans header)
   ↓ Authorization: Bearer <token>
   
3. Forum Service → Extrait le token
   ↓ Passe le token à UserServiceClient
   
4. UserServiceClient → Appelle User Service (avec Token)
   ↓ Authorization: Bearer <token>
   
5. User Service → Valide le token et retourne User
   ↓
   
6. Forum Service → Valide userId et crée le Post
   ↓
   
7. Retourne le Post créé ✅
```

---

## 🧪 Tests avec Postman

### Test 1 : Login et obtenir le token

**Collection Postman :**

1. **Login**
   - Method: `POST`
   - URL: `http://localhost:8081/api/auth/login`
   - Body:
   ```json
   {
     "email": "admin@platform.com",
     "password": "Admin123!"
   }
   ```
   - **Script de test (Postman) :**
   ```javascript
   // Sauvegarder le token dans une variable d'environnement
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       pm.environment.set("jwt_token", jsonData.token);
       console.log("Token sauvegardé:", jsonData.token);
   }
   ```

### Test 2 : Créer un Post avec le token

2. **Créer Post**
   - Method: `POST`
   - URL: `http://localhost:8084/api/forum/posts`
   - Headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer {{jwt_token}}`
   - Body:
   ```json
   {
     "userId": 1,
     "title": "Post avec JWT",
     "content": "Contenu du post"
   }
   ```

---

## 📋 Exemples avec curl

### Étape 1 : Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"Admin123!"}'
```

**Réponse :**
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{...}}
```

### Étape 2 : Créer Post avec Token
```bash
# Remplacer <TOKEN> par le token obtenu
curl -X POST http://localhost:8084/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"userId":1,"title":"Mon post","content":"Contenu"}'
```

---

## 🔍 Vérification dans les Logs

### Forum Service
```
INFO  UserServiceClient - Communication inter-microservices réussie: User 1 existe, actif: true
```

### API Gateway
```
GET /api/users/1
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Service
```
GET /api/users/1
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ Cas d'Erreur

### Erreur : Token manquant ou invalide

**Requête sans token :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json

{
  "userId": 1,
  "title": "Test",
  "content": "Test"
}
```

**Comportement :** 
- Le Forum Service fonctionnera quand même (token optionnel pour l'instant)
- Mais le User Service pourrait rejeter la requête si la sécurité est activée

### Erreur : Token expiré

**Réponse :** `401 Unauthorized`

**Solution :** Se reconnecter pour obtenir un nouveau token

---

## ✅ Checklist de Test

- [ ] Login réussi et token obtenu
- [ ] Token copié et sauvegardé
- [ ] Post créé avec token dans header Authorization
- [ ] Logs montrent la communication avec token
- [ ] Validation userId fonctionne
- [ ] Post créé avec succès

---

## 🎯 Résumé

**Architecture avec JWT :**
```
Client
  ↓ (Login)
User Service → Génère JWT Token
  ↓
Client
  ↓ (Créer Post avec Token)
Forum Service → Extrait Token
  ↓ (Appelle avec Token)
API Gateway → Passe Token
  ↓
User Service → Valide Token + User
  ↓
Forum Service → Crée Post ✅
```

**Avantages :**
- ✅ Authentification sécurisée
- ✅ Token réutilisable pour plusieurs requêtes
- ✅ Communication inter-microservices authentifiée
- ✅ Traçabilité des utilisateurs

---

## 📝 Notes Importantes

1. **Format du Header :** `Authorization: Bearer <token>`
2. **Token valide :** 24 heures par défaut (configurable)
3. **Token contient :** userId, email, role
4. **Sécurité :** Le token est passé dans tous les appels inter-services

Tout est prêt pour tester avec authentification JWT ! 🔐



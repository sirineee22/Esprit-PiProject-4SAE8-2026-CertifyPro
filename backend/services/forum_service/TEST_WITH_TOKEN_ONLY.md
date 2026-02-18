# ✅ Guide de Test - Créer un Post avec Token JWT uniquement

## 🎯 Objectif

Créer un Post **sans fournir userId** dans le body. Le `userId` est **automatiquement extrait du token JWT**.

---

## 🔑 Étape 1 : Obtenir le Token JWT (Login)

### 1.1 Se connecter

**Requête :**
```bash
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "Admin123!"
}
```

**Réponse :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@platform.com",
    ...
  }
}
```

**⚠️ IMPORTANT : Copier le `token` !**

---

## 📝 Étape 2 : Créer un Post (SANS userId dans le body)

### 2.1 Créer un Post avec seulement le token

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Mon post avec JWT",
  "content": "Contenu du post"
}
```

**✅ Note :** Plus besoin de `userId` dans le body ! Il est extrait automatiquement du token.

**Réponse attendue (200 OK) :**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Mon post avec JWT",
  "content": "Contenu du post",
  "createdAt": "2024-02-18T22:50:00.123456"
}
```

---

## 🔄 Comment ça fonctionne

```
1. Client → Login → User Service
   ↓ Retourne: JWT Token (contient userId)

2. Client → Créer Post (avec Token seulement)
   ↓ Header: Authorization: Bearer <token>
   ↓ Body: { "title": "...", "content": "..." }
   ↓ (PAS de userId dans le body)

3. Forum Service → Extrait Token
   ↓ Décode le token JWT
   ↓ Extrait userId du token automatiquement

4. Forum Service → Valide userId via User Service
   ↓ (avec le token pour authentification)

5. Forum Service → Crée le Post avec userId extrait
   ↓
   
6. Retourne le Post créé ✅
```

---

## 🧪 Test avec Postman

### Collection Postman

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
   - **Script de test :**
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       pm.environment.set("jwt_token", jsonData.token);
       console.log("Token sauvegardé:", jsonData.token);
   }
   ```

2. **Créer Post** (SANS userId)
   - Method: `POST`
   - URL: `http://localhost:8084/api/forum/posts`
   - Headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer {{jwt_token}}`
   - Body:
   ```json
   {
     "title": "Mon post",
     "content": "Contenu du post"
   }
   ```
   - **✅ Pas de userId dans le body !**

---

## 📋 Exemples avec curl

### Étape 1 : Login
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"Admin123!"}'
```

### Étape 2 : Créer Post (avec token seulement)
```bash
# Remplacer <TOKEN> par le token obtenu
curl -X POST http://localhost:8084/api/forum/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Mon post","content":"Contenu"}'
```

**✅ Note :** Pas de `userId` dans le JSON !

---

## ❌ Cas d'Erreur

### Erreur : Token manquant

**Requête sans token :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json

{
  "title": "Test",
  "content": "Test"
}
```

**Réponse (401 Unauthorized) :**
```json
"Authorization token is required. Please login first."
```

### Erreur : Token invalide ou expiré

**Réponse (401 Unauthorized) :**
```json
"Invalid or expired token. Please login again."
```

### Erreur : Body avec userId (ancien format)

**Si tu mets userId dans le body :**
```json
{
  "userId": 1,
  "title": "Test",
  "content": "Test"
}
```

**Comportement :** Le `userId` dans le body sera **ignoré**. Le système utilisera le `userId` extrait du token.

---

## 💬 Créer un Commentaire (même principe)

### Créer un Commentaire avec token seulement

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts/1/comments
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "content": "Mon commentaire"
}
```

**✅ Pas de userId dans le body !** Il est extrait automatiquement du token.

---

## ✅ Avantages

1. **Sécurité** : L'utilisateur ne peut pas créer de posts avec un autre userId
2. **Simplicité** : Pas besoin de fournir userId manuellement
3. **Cohérence** : Le userId vient toujours du token authentifié
4. **Moins d'erreurs** : Impossible de se tromper de userId

---

## 📊 Comparaison

### ❌ Avant (avec userId manuel)
```json
{
  "userId": 1,  // ❌ Peut être modifié par le client
  "title": "Post",
  "content": "Contenu"
}
```

### ✅ Maintenant (userId automatique)
```json
{
  "title": "Post",
  "content": "Contenu"
}
// ✅ userId extrait automatiquement du token JWT
```

---

## ✅ Checklist de Test

- [ ] Login réussi et token obtenu
- [ ] Token copié
- [ ] Post créé avec token dans header (SANS userId dans body)
- [ ] Post créé avec succès
- [ ] Le userId dans la réponse correspond à celui du token
- [ ] Test sans token → Erreur 401
- [ ] Test avec token invalide → Erreur 401

---

## 🎯 Résumé

**Maintenant tu peux créer un post avec seulement :**
1. ✅ Le token JWT dans le header `Authorization: Bearer <token>`
2. ✅ Le `title` et `content` dans le body

**Plus besoin de :**
- ❌ Fournir `userId` dans le body
- ❌ Se soucier de quel userId utiliser

**Le système fait tout automatiquement !** 🎉


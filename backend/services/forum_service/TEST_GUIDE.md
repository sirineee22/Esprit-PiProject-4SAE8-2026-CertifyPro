# Guide de Test - Forum Service CRUD

## 📋 Prérequis

### 1. Base de données PostgreSQL
```sql
-- Créer la base de données
CREATE DATABASE forumdb;

-- Vérifier que la base existe
\l
```

### 2. Services à démarrer (dans l'ordre)
1. **Discovery Server (Eureka)** - Port 8761
2. **Forum Service** - Port 8084
3. **API Gateway** - Port 8081 (optionnel, pour passer par le gateway)

```powershell
# Option 1: Démarrer tous les services
.\start-all-services.ps1

# Option 2: Démarrer uniquement le forum service
.\start-forum-service.ps1
```

### 3. Vérifier que le service est démarré
- **Eureka Dashboard**: http://localhost:8761
- Vérifier que `FORUM-SERVICE` apparaît dans la liste des services

---

## 🧪 Tests des CRUD - Posts

### Base URL
- **Direct**: `http://localhost:8084/api/forum/posts`
- **Via Gateway**: `http://localhost:8081/api/forum/posts`

---

### ✅ Test 1: Créer un Post (CREATE)

**Requête:**
```bash
curl -X POST http://localhost:8084/api/forum/posts ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 1, \"title\": \"Mon premier post\", \"content\": \"Ceci est le contenu de mon premier post sur le forum.\"}"
```

**Réponse attendue (201/200):**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Mon premier post",
  "content": "Ceci est le contenu de mon premier post sur le forum.",
  "createdAt": "2024-02-18T20:56:35.123456"
}
```

**Note:** Notez l'`id` retourné (ex: `1`) pour les tests suivants.

---

### ✅ Test 2: Récupérer tous les Posts (READ ALL)

**Requête:**
```bash
curl -X GET http://localhost:8084/api/forum/posts
```

**Réponse attendue:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Mon premier post",
    "content": "Ceci est le contenu de mon premier post sur le forum.",
    "createdAt": "2024-02-18T20:56:35.123456"
  }
]
```

---

### ✅ Test 3: Récupérer un Post par ID (READ ONE)

**Requête:**
```bash
curl -X GET http://localhost:8084/api/forum/posts/1
```

**Réponse attendue:**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Mon premier post",
  "content": "Ceci est le contenu de mon premier post sur le forum.",
  "createdAt": "2024-02-18T20:56:35.123456"
}
```

**Test d'erreur (ID inexistant):**
```bash
curl -X GET http://localhost:8084/api/forum/posts/999
```
**Réponse:** `404 Not Found`

---

### ✅ Test 4: Mettre à jour un Post (UPDATE)

**Requête:**
```bash
curl -X PUT http://localhost:8084/api/forum/posts/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Post modifié\", \"content\": \"Contenu mis à jour du post.\"}"
```

**Réponse attendue:**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Post modifié",
  "content": "Contenu mis à jour du post.",
  "createdAt": "2024-02-18T20:56:35.123456"
}
```

**Note:** Vous pouvez mettre à jour seulement le titre ou seulement le contenu.

---

### ✅ Test 5: Supprimer un Post (DELETE)

**Requête:**
```bash
curl -X DELETE http://localhost:8084/api/forum/posts/1
```

**Réponse attendue:** `200 OK` (pas de contenu)

**Vérification:**
```bash
curl -X GET http://localhost:8084/api/forum/posts/1
```
**Réponse:** `404 Not Found`

---

## 🧪 Tests des CRUD - Comments

### Base URL
- **Direct**: `http://localhost:8084/api/forum/comments`
- **Via Gateway**: `http://localhost:8081/api/forum/comments`

---

### ✅ Test 6: Créer un Comment sur un Post (CREATE)

**Prérequis:** Avoir créé un Post avec `id = 1` (ou utiliser un autre ID)

**Requête:**
```bash
curl -X POST http://localhost:8084/api/forum/posts/1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 2, \"content\": \"Excellent post, merci pour le partage !\"}"
```

**Réponse attendue:**
```json
{
  "id": 1,
  "postId": 1,
  "userId": 2,
  "content": "Excellent post, merci pour le partage !",
  "commentDate": "2024-02-18T21:00:00.123456"
}
```

---

### ✅ Test 7: Récupérer tous les Comments d'un Post (READ ALL)

**Requête:**
```bash
curl -X GET http://localhost:8084/api/forum/posts/1/comments
```

**Réponse attendue:**
```json
[
  {
    "id": 1,
    "postId": 1,
    "userId": 2,
    "content": "Excellent post, merci pour le partage !",
    "commentDate": "2024-02-18T21:00:00.123456"
  }
]
```

---

### ✅ Test 8: Récupérer un Comment par ID (READ ONE)

**Requête:**
```bash
curl -X GET http://localhost:8084/api/forum/comments/1
```

**Réponse attendue:**
```json
{
  "id": 1,
  "postId": 1,
  "userId": 2,
  "content": "Excellent post, merci pour le partage !",
  "commentDate": "2024-02-18T21:00:00.123456"
}
```

---

### ✅ Test 9: Mettre à jour un Comment (UPDATE)

**Requête:**
```bash
curl -X PUT http://localhost:8084/api/forum/comments/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"content\": \"Commentaire modifié avec plus de détails.\"}"
```

**Réponse attendue:**
```json
{
  "id": 1,
  "postId": 1,
  "userId": 2,
  "content": "Commentaire modifié avec plus de détails.",
  "commentDate": "2024-02-18T21:00:00.123456"
}
```

---

### ✅ Test 10: Supprimer un Comment (DELETE)

**Requête:**
```bash
curl -X DELETE http://localhost:8084/api/forum/comments/1
```

**Réponse attendue:** `200 OK`

**Vérification:**
```bash
curl -X GET http://localhost:8084/api/forum/comments/1
```
**Réponse:** `404 Not Found`

---

## 🔄 Test de Cascade Delete

### ✅ Test 11: Supprimer un Post avec ses Comments

1. Créer un Post:
```bash
curl -X POST http://localhost:8084/api/forum/posts ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 1, \"title\": \"Post à supprimer\", \"content\": \"Contenu\"}"
```
Notez l'ID (ex: `2`)

2. Créer plusieurs Comments:
```bash
curl -X POST http://localhost:8084/api/forum/posts/2/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 2, \"content\": \"Commentaire 1\"}"

curl -X POST http://localhost:8084/api/forum/posts/2/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 3, \"content\": \"Commentaire 2\"}"
```

3. Vérifier que les comments existent:
```bash
curl -X GET http://localhost:8084/api/forum/posts/2/comments
```

4. Supprimer le Post:
```bash
curl -X DELETE http://localhost:8084/api/forum/posts/2
```

5. Vérifier que les comments ont été supprimés automatiquement:
```bash
curl -X GET http://localhost:8084/api/forum/posts/2/comments
```
**Réponse:** `[]` (liste vide)

---

## 🧪 Tests de Validation

### ✅ Test 12: Créer un Post sans titre (erreur de validation)

**Requête:**
```bash
curl -X POST http://localhost:8084/api/forum/posts ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 1, \"content\": \"Contenu sans titre\"}"
```

**Réponse attendue:** `400 Bad Request`

---

### ✅ Test 13: Créer un Comment sans contenu (erreur de validation)

**Requête:**
```bash
curl -X POST http://localhost:8084/api/forum/posts/1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 2}"
```

**Réponse attendue:** `400 Bad Request`

---

## 📝 Scénario Complet de Test

### Workflow complet:
1. ✅ Créer 2 Posts différents
2. ✅ Créer 3 Comments sur le premier Post
3. ✅ Créer 2 Comments sur le deuxième Post
4. ✅ Récupérer tous les Posts
5. ✅ Récupérer tous les Comments du premier Post
6. ✅ Modifier un Post
7. ✅ Modifier un Comment
8. ✅ Supprimer un Comment
9. ✅ Supprimer un Post (vérifier cascade delete)

---

## 🛠️ Alternative: Utiliser Postman ou Insomnia

### Collection Postman
1. Créer une nouvelle collection "Forum Service"
2. Base URL: `http://localhost:8084/api/forum`
3. Créer les requêtes suivantes:
   - `GET /posts`
   - `GET /posts/{id}`
   - `POST /posts` (avec body JSON)
   - `PUT /posts/{id}` (avec body JSON)
   - `DELETE /posts/{id}`
   - `GET /posts/{postId}/comments`
   - `POST /posts/{postId}/comments` (avec body JSON)
   - `GET /comments/{id}`
   - `PUT /comments/{id}` (avec body JSON)
   - `DELETE /comments/{id}`

---

## 🔍 Vérification dans la Base de Données

### Se connecter à PostgreSQL:
```bash
psql -U postgres -d forumdb
```

### Requêtes SQL utiles:
```sql
-- Voir tous les posts
SELECT * FROM posts;

-- Voir tous les comments
SELECT * FROM comments;

-- Voir les posts avec leurs comments
SELECT p.id, p.title, c.id as comment_id, c.content
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
ORDER BY p.id, c.id;

-- Compter les comments par post
SELECT p.id, p.title, COUNT(c.id) as comment_count
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, p.title;
```

---

## ✅ Checklist de Test

- [ ] Service Forum démarré (port 8084)
- [ ] Service visible dans Eureka (http://localhost:8761)
- [ ] Base de données `forumdb` créée
- [ ] CRUD Posts fonctionnel (Create, Read, Update, Delete)
- [ ] CRUD Comments fonctionnel (Create, Read, Update, Delete)
- [ ] Cascade delete fonctionne (suppression Post → suppression Comments)
- [ ] Validation des champs obligatoires fonctionne
- [ ] Gestion des erreurs 404 fonctionne
- [ ] Via API Gateway fonctionne (port 8081)

---

## 🐛 Dépannage

### Erreur: "Connection refused"
- Vérifier que le service est démarré
- Vérifier le port (8084 pour direct, 8081 pour gateway)

### Erreur: "Database connection failed"
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `application.properties`
- Vérifier que la base `forumdb` existe

### Erreur: "Service not found in Eureka"
- Attendre quelques secondes après le démarrage
- Vérifier que Eureka est démarré (port 8761)
- Vérifier les logs du service Forum

### Erreur: "404 Not Found" via Gateway
- Vérifier que le service Forum est enregistré dans Eureka
- Vérifier la route dans `application.yml` du gateway
- Redémarrer le gateway après avoir démarré le service Forum


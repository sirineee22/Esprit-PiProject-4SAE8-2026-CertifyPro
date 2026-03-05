# 📮 Guide Postman - Forum Service CRUD

## 🔧 Configuration Postman

### Variables d'environnement (optionnel)
Créez un environnement Postman avec ces variables :
- `base_url_direct`: `http://localhost:8084`
- `base_url_gateway`: `http://localhost:8081`
- `post_id`: `1` (à mettre à jour après création)
- `comment_id`: `1` (à mettre à jour après création)

---

## 📝 POSTS - CRUD Complet

### 1. CREATE POST - Créer un nouveau post

**Méthode:** `POST`

**URL Direct:**
```
http://localhost:8084/api/forum/posts
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": 1,
  "title": "Comment bien démarrer avec Spring Boot ?",
  "content": "Je cherche des conseils pour bien commencer avec Spring Boot. Quels sont les meilleures pratiques à suivre ?"
}
```

**Réponse attendue (200 OK):**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Comment bien démarrer avec Spring Boot ?",
  "content": "Je cherche des conseils pour bien commencer avec Spring Boot. Quels sont les meilleures pratiques à suivre ?",
  "createdAt": "2024-02-18T22:10:00.123456"
}
```

**Note:** Notez l'`id` retourné pour les tests suivants (ex: `1`).

---

### 2. GET ALL POSTS - Récupérer tous les posts

**Méthode:** `GET`

**URL Direct:**
```
http://localhost:8084/api/forum/posts
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts
```

**Headers:**
```
(Aucun header requis)
```

**Body:**
```
(Aucun body)
```

**Réponse attendue (200 OK):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Comment bien démarrer avec Spring Boot ?",
    "content": "Je cherche des conseils pour bien commencer avec Spring Boot. Quels sont les meilleures pratiques à suivre ?",
    "createdAt": "2024-02-18T22:10:00.123456"
  },
  {
    "id": 2,
    "userId": 2,
    "title": "Meilleur framework pour microservices ?",
    "content": "Quel framework recommandez-vous pour développer des microservices ?",
    "createdAt": "2024-02-18T22:15:00.123456"
  }
]
```

---

### 3. GET POST BY ID - Récupérer un post par son ID

**Méthode:** `GET`

**URL Direct:**
```
http://localhost:8084/api/forum/posts/1
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts/1
```

**Headers:**
```
(Aucun header requis)
```

**Body:**
```
(Aucun body)
```

**Réponse attendue (200 OK):**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Comment bien démarrer avec Spring Boot ?",
  "content": "Je cherche des conseils pour bien commencer avec Spring Boot. Quels sont les meilleures pratiques à suivre ?",
  "createdAt": "2024-02-18T22:10:00.123456"
}
```

**Réponse si non trouvé (404 Not Found):**
```
(Aucun body)
```

---

### 4. UPDATE POST - Mettre à jour un post

**Méthode:** `PUT`

**URL Direct:**
```
http://localhost:8084/api/forum/posts/1
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts/1
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON) - Mise à jour complète:**
```json
{
  "title": "Comment bien démarrer avec Spring Boot ? (Mis à jour)",
  "content": "J'ai trouvé de bonnes ressources. Voici ce que j'ai appris jusqu'à présent..."
}
```

**Body (raw JSON) - Mise à jour partielle (seulement le titre):**
```json
{
  "title": "Nouveau titre du post"
}
```

**Body (raw JSON) - Mise à jour partielle (seulement le contenu):**
```json
{
  "content": "Nouveau contenu du post"
}
```

**Réponse attendue (200 OK):**
```json
{
  "id": 1,
  "userId": 1,
  "title": "Comment bien démarrer avec Spring Boot ? (Mis à jour)",
  "content": "J'ai trouvé de bonnes ressources. Voici ce que j'ai appris jusqu'à présent...",
  "createdAt": "2024-02-18T22:10:00.123456"
}
```

**Réponse si non trouvé (404 Not Found):**
```
(Aucun body)
```

---

### 5. DELETE POST - Supprimer un post

**Méthode:** `DELETE`

**URL Direct:**
```
http://localhost:8084/api/forum/posts/1
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts/1
```

**Headers:**
```
(Aucun header requis)
```

**Body:**
```
(Aucun body)
```

**Réponse attendue (200 OK):**
```
(Aucun body - statut 200)
```

**Réponse si non trouvé (404 Not Found):**
```
(Aucun body)
```

**Note:** La suppression d'un post supprime automatiquement tous ses commentaires (cascade delete).

---

## 💬 COMMENTS - CRUD Complet

### 6. CREATE COMMENT - Créer un commentaire sur un post

**Méthode:** `POST`

**URL Direct:**
```
http://localhost:8084/api/forum/posts/1/comments
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts/1/comments
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": 2,
  "content": "Excellent post ! Je recommande de commencer par la documentation officielle de Spring Boot."
}
```

**Réponse attendue (200 OK):**
```json
{
  "id": 1,
  "postId": 1,
  "userId": 2,
  "content": "Excellent post ! Je recommande de commencer par la documentation officielle de Spring Boot.",
  "commentDate": "2024-02-18T22:20:00.123456"
}
```

**Réponse si le post n'existe pas (404 Not Found):**
```
(Aucun body)
```

**Note:** Remplacez `1` dans l'URL par l'ID d'un post existant.

---

### 7. GET COMMENTS BY POST - Récupérer tous les commentaires d'un post

**Méthode:** `GET`

**URL Direct:**
```
http://localhost:8084/api/forum/posts/1/comments
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/posts/1/comments
```

**Headers:**
```
(Aucun header requis)
```

**Body:**
```
(Aucun body)
```

**Réponse attendue (200 OK):**
```json
[
  {
    "id": 1,
    "postId": 1,
    "userId": 2,
    "content": "Excellent post ! Je recommande de commencer par la documentation officielle de Spring Boot.",
    "commentDate": "2024-02-18T22:20:00.123456"
  },
  {
    "id": 2,
    "postId": 1,
    "userId": 3,
    "content": "Je recommande aussi le cours Spring Boot sur Udemy.",
    "commentDate": "2024-02-18T22:25:00.123456"
  }
]
```

**Réponse si le post n'existe pas (404 Not Found):**
```
(Aucun body)
```

---

### 8. GET COMMENT BY ID - Récupérer un commentaire par son ID

**Méthode:** `GET`

**URL Direct:**
```
http://localhost:8084/api/forum/comments/1
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/comments/1
```

**Headers:**
```
(Aucun header requis)
```

**Body:**
```
(Aucun body)
```

**Réponse attendue (200 OK):**
```json
{
  "id": 1,
  "postId": 1,
  "userId": 2,
  "content": "Excellent post ! Je recommande de commencer par la documentation officielle de Spring Boot.",
  "commentDate": "2024-02-18T22:20:00.123456"
}
```

**Réponse si non trouvé (404 Not Found):**
```
(Aucun body)
```

---

### 9. UPDATE COMMENT - Mettre à jour un commentaire

**Méthode:** `PUT`

**URL Direct:**
```
http://localhost:8084/api/forum/comments/1
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/comments/1
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "content": "Excellent post ! Je recommande de commencer par la documentation officielle de Spring Boot. Voici le lien: https://spring.io/projects/spring-boot"
}
```

**Réponse attendue (200 OK):**
```json
{
  "id": 1,
  "postId": 1,
  "userId": 2,
  "content": "Excellent post ! Je recommande de commencer par la documentation officielle de Spring Boot. Voici le lien: https://spring.io/projects/spring-boot",
  "commentDate": "2024-02-18T22:20:00.123456"
}
```

**Réponse si non trouvé (404 Not Found):**
```
(Aucun body)
```

---

### 10. DELETE COMMENT - Supprimer un commentaire

**Méthode:** `DELETE`

**URL Direct:**
```
http://localhost:8084/api/forum/comments/1
```

**URL Via Gateway:**
```
http://localhost:8081/api/forum/comments/1
```

**Headers:**
```
(Aucun header requis)
```

**Body:**
```
(Aucun body)
```

**Réponse attendue (200 OK):**
```
(Aucun body - statut 200)
```

**Réponse si non trouvé (404 Not Found):**
```
(Aucun body)
```

---

## 🧪 Tests de Validation

### 11. CREATE POST - Test de validation (erreur attendue)

**Méthode:** `POST`

**URL:**
```
http://localhost:8084/api/forum/posts
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON) - Sans titre (erreur):**
```json
{
  "userId": 1,
  "content": "Contenu sans titre"
}
```

**Réponse attendue (400 Bad Request):**
```json
{
  "timestamp": "2024-02-18T22:30:00.123456",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

### 12. CREATE COMMENT - Test de validation (erreur attendue)

**Méthode:** `POST`

**URL:**
```
http://localhost:8084/api/forum/posts/1/comments
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON) - Sans contenu (erreur):**
```json
{
  "userId": 2
}
```

**Réponse attendue (400 Bad Request):**
```json
{
  "timestamp": "2024-02-18T22:30:00.123456",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "content",
      "message": "Content is required"
    }
  ]
}
```

---

## 📋 Scénario de Test Complet

### Workflow recommandé pour tester tous les CRUD :

1. **CREATE POST** → Notez l'`id` retourné (ex: `1`)
2. **GET ALL POSTS** → Vérifiez que le post apparaît dans la liste
3. **GET POST BY ID** → Vérifiez les détails du post créé
4. **CREATE COMMENT** → Créez un commentaire sur le post (ID: 1)
5. **GET COMMENTS BY POST** → Vérifiez que le commentaire apparaît
6. **GET COMMENT BY ID** → Vérifiez les détails du commentaire
7. **UPDATE POST** → Modifiez le post
8. **UPDATE COMMENT** → Modifiez le commentaire
9. **CREATE POST 2** → Créez un deuxième post pour tester le cascade delete
10. **CREATE COMMENT 2** → Créez plusieurs commentaires sur le post 2
11. **DELETE POST 2** → Supprimez le post 2
12. **GET COMMENTS BY POST** → Vérifiez que les commentaires ont été supprimés automatiquement (cascade delete)
13. **DELETE COMMENT** → Supprimez le commentaire restant
14. **DELETE POST** → Supprimez le post restant

---

## 🔍 Codes de Statut HTTP

| Code | Signification |
|------|---------------|
| 200 | OK - Requête réussie |
| 201 | Created - Ressource créée (peut être retourné pour POST) |
| 400 | Bad Request - Erreur de validation |
| 404 | Not Found - Ressource non trouvée |
| 500 | Internal Server Error - Erreur serveur |

---

## 📝 Notes Importantes

1. **Base URL:** 
   - Direct: `http://localhost:8084`
   - Via Gateway: `http://localhost:8081`

2. **IDs dynamiques:** Remplacez `1` dans les URLs par les IDs réels retournés après création.

3. **Cascade Delete:** La suppression d'un post supprime automatiquement tous ses commentaires.

4. **Validation:** Les champs `title` (pour Post) et `content` (pour Comment) sont obligatoires.

5. **Dates:** Les dates sont générées automatiquement par le serveur (`createdAt` pour Post, `commentDate` pour Comment).

---

## 🚀 Import dans Postman

Pour importer ces requêtes dans Postman, utilisez le fichier `postman-collection.json` fourni dans le même dossier.


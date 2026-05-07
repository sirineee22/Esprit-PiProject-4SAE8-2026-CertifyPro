# 🚀 Guide de Démarrage Rapide - Forum Service

## Étape 1: Créer la Base de Données

```sql
-- Se connecter à PostgreSQL
psql -U postgres

-- Créer la base de données
CREATE DATABASE forumdb;

-- Vérifier
\l
```

**OU** utiliser le script fourni:
```bash
psql -U postgres -f create-database.sql
```

---

## Étape 2: Démarrer les Services

### Option A: Démarrer tous les services (recommandé)
```powershell
.\start-all-services.ps1
```

### Option B: Démarrer uniquement le Forum Service
```powershell
.\start-forum-service.ps1
```

**Attendre 30-60 secondes** que le service démarre complètement.

---

## Étape 3: Vérifier que le Service est Démarré

1. **Eureka Dashboard**: http://localhost:8761
   - Vérifier que `FORUM-SERVICE` apparaît dans la liste

2. **Test rapide**:
```bash
curl http://localhost:8084/api/forum/posts
```
Réponse attendue: `[]` (liste vide au début)

---

## Étape 4: Tester les CRUD

### Méthode 1: Script Automatique (Recommandé) ⚡

```powershell
cd backend\services\forum_service
.\test-forum-crud.ps1
```

Ce script teste automatiquement tous les CRUD et affiche les résultats.

---

### Méthode 2: Tests Manuels avec curl

#### Créer un Post:
```bash
curl -X POST http://localhost:8084/api/forum/posts ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 1, \"title\": \"Mon premier post\", \"content\": \"Contenu du post\"}"
```

#### Récupérer tous les Posts:
```bash
curl http://localhost:8084/api/forum/posts
```

#### Créer un Comment:
```bash
curl -X POST http://localhost:8084/api/forum/posts/1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": 2, \"content\": \"Excellent post !\"}"
```

#### Récupérer les Comments d'un Post:
```bash
curl http://localhost:8084/api/forum/posts/1/comments
```

---

### Méthode 3: Utiliser Postman/Insomnia

1. Importer les exemples depuis `test-examples.json`
2. Base URL: `http://localhost:8084/api/forum`
3. Tester chaque endpoint

---

## 📚 Documentation Complète

Pour plus de détails, voir: **`TEST_GUIDE.md`**

---

## ✅ Checklist Rapide

- [ ] PostgreSQL démarré
- [ ] Base de données `forumdb` créée
- [ ] Discovery Server (Eureka) démarré (port 8761)
- [ ] Forum Service démarré (port 8084)
- [ ] Service visible dans Eureka
- [ ] Tests CRUD réussis

---

## 🐛 Problèmes Courants

### "Connection refused"
→ Vérifier que le service est démarré sur le port 8084

### "Database connection failed"
→ Vérifier que PostgreSQL est démarré et que la base `forumdb` existe

### "Service not found" via Gateway
→ Attendre quelques secondes après le démarrage du service Forum

---

## 📞 URLs Utiles

- **Forum Service Direct**: http://localhost:8084/api/forum
- **Via API Gateway**: http://localhost:8081/api/forum
- **Eureka Dashboard**: http://localhost:8761
- **Swagger/OpenAPI**: http://localhost:8084/swagger-ui.html (si configuré)


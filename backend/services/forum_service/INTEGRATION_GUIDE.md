# 🔗 Guide d'Intégration - Forum Service ↔ User Service

## 📋 Vue d'ensemble

Ce guide explique comment le **forum_service** communique avec le **user-service** pour valider automatiquement les `userId` avant de créer des posts ou des commentaires.

---

## ✅ Ce qui a été fait

### 1. **Dépendances ajoutées**
- `spring-cloud-starter-loadbalancer` : Pour la découverte de services via Eureka

### 2. **Composants créés**

#### **UserDto** (`dto/UserDto.java`)
- DTO simplifié pour représenter un User depuis le user-service
- Contient uniquement les champs nécessaires : `id`, `firstName`, `lastName`, `email`, `active`

#### **RestTemplateConfig** (`config/RestTemplateConfig.java`)
- Configuration de `RestTemplate` avec `@LoadBalanced`
- Permet d'utiliser le nom du service Eureka (`USER-SERVICE`) au lieu de l'URL complète

#### **UserServiceClient** (`service/UserServiceClient.java`)
- Service client pour communiquer avec le user-service
- Méthodes disponibles :
  - `userExists(Long userId)` : Vérifie si un utilisateur existe et est actif
  - `getUserById(Long userId)` : Récupère les informations d'un utilisateur

### 3. **Controllers modifiés**

#### **PostController**
- Validation automatique de `userId` avant création d'un post
- Retourne `400 Bad Request` si l'utilisateur n'existe pas ou n'est pas actif

#### **PostCommentController**
- Validation automatique de `userId` avant création d'un commentaire
- Retourne `400 Bad Request` si l'utilisateur n'existe pas ou n'est pas actif

---

## 🔧 Comment ça fonctionne

### Architecture (✅ Bonne Pratique Microservices)

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Forum Service  │────────▶│ API Gateway │────────▶│    Eureka    │────────▶│  User Service   │
│   (Port 8084)   │         │  (Port 8081) │         │  (Port 8761) │         │   (Port 8083)   │
└─────────────────┘         └──────────────┘         └──────────────┘         └─────────────────┘
       │                            │
       │                            │
       └────────────────────────────┘
    Communication via RestTemplate
    vers API Gateway (point d'entrée unique)
```

**✅ Avantages de cette architecture :**
- **Découplage** : Forum Service ne connaît pas directement User Service
- **Point d'entrée unique** : Tous les appels passent par le Gateway
- **Sécurité centralisée** : Authentification/autorisation au niveau Gateway
- **Traçabilité** : Tous les appels sont loggés au même endroit
- **Flexibilité** : On peut changer User Service sans affecter Forum Service

### Flux de validation

1. **Client fait une requête** pour créer un post/comment avec un `userId`
2. **Forum Service** reçoit la requête
3. **UserServiceClient** appelle le user-service **via API Gateway** :
   - URL utilisée : `http://localhost:8081/api/users/{userId}`
   - L'API Gateway route automatiquement vers `USER-SERVICE` via Eureka
4. **User Service** répond avec les informations de l'utilisateur
5. **Forum Service** valide :
   - Si l'utilisateur existe → Crée le post/comment
   - Si l'utilisateur n'existe pas ou n'est pas actif → Retourne `400 Bad Request`

**✅ Pourquoi passer par l'API Gateway ?**
- C'est la **bonne pratique** en microservices
- Découplage : Forum Service ne dépend pas directement de User Service
- Tous les appels inter-services passent par un point d'entrée unique

---

## 🚀 Démarrage

### Prérequis

1. **Eureka Discovery Server** doit être démarré (port 8761)
2. **API Gateway** doit être démarré (port 8081) ⭐ **IMPORTANT**
3. **User Service** doit être démarré et enregistré dans Eureka (port 8083)
4. **Forum Service** doit être démarré (port 8084)

### Ordre de démarrage

```powershell
# 1. Démarrer Eureka Discovery Server
cd backend\discovery-server
mvn spring-boot:run

# 2. Démarrer API Gateway ⭐ IMPORTANT
cd backend\api-gateway
mvn spring-boot:run

# 3. Démarrer User Service
cd backend\services\user-service
mvn spring-boot:run

# 4. Attendre que User Service soit enregistré dans Eureka (30-60 secondes)

# 5. Démarrer Forum Service
cd backend\services\forum_service
mvn spring-boot:run
```

### Vérification

1. **Eureka Dashboard** : http://localhost:8761
   - Vérifier que `API-GATEWAY`, `USER-SERVICE` et `FORUM-SERVICE` sont enregistrés

2. **Vérifier que l'API Gateway fonctionne** :
   ```bash
   # Tester l'accès au User Service via Gateway
   curl http://localhost:8081/api/users
   ```

3. **Test de validation** :
   ```bash
   # Créer un post avec un userId inexistant (doit retourner 400)
   curl -X POST http://localhost:8084/api/forum/posts \
     -H "Content-Type: application/json" \
     -d '{"userId": 999, "title": "Test", "content": "Test"}'
   ```

---

## 📝 Exemples d'utilisation

### ✅ Cas réussi : Utilisateur existe et est actif

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json

{
  "userId": 1,
  "title": "Mon premier post",
  "content": "Contenu du post"
}
```

**Réponse :** `200 OK`
```json
{
  "id": 1,
  "userId": 1,
  "title": "Mon premier post",
  "content": "Contenu du post",
  "createdAt": "2024-02-18T22:30:00.123456"
}
```

---

### ❌ Cas d'erreur : Utilisateur n'existe pas

**Requête :**
```bash
POST http://localhost:8084/api/forum/posts
Content-Type: application/json

{
  "userId": 999,
  "title": "Test",
  "content": "Test"
}
```

**Réponse :** `400 Bad Request`
```json
"User with ID 999 does not exist or is not active"
```

---

### ❌ Cas d'erreur : Utilisateur existe mais n'est pas actif

Si un utilisateur existe mais a `active = false`, la validation échouera également.

---

## 🔍 Dépannage

### Problème : "Connection refused" vers API Gateway

**Cause :** L'API Gateway n'est pas démarré ou n'est pas accessible

**Solutions :**
1. Vérifier que l'API Gateway est démarré (port 8081)
2. Tester directement : `curl http://localhost:8081/api/users`
3. Vérifier les logs de l'API Gateway
4. Vérifier que l'API Gateway est enregistré dans Eureka

---

### Problème : "Connection refused"

**Cause :** User Service n'est pas accessible

**Solutions :**
1. Vérifier que User Service est démarré (port 8083)
2. Vérifier que User Service répond : `curl http://localhost:8083/api/users`
3. Vérifier les logs du User Service

---

### Problème : Validation toujours en échec même avec un utilisateur valide

**Solutions :**
1. Vérifier que l'utilisateur existe dans la base de données userdb
2. Vérifier que `active = true` pour l'utilisateur
3. Tester directement : `curl http://localhost:8083/api/users/1`
4. Vérifier les logs du Forum Service pour voir les erreurs

---

## 📊 Logs utiles

### Forum Service

Les logs montrent les appels au user-service :
```
INFO  UserServiceClient - User 1 existe: true, actif: true
WARN  UserServiceClient - User 999 n'existe pas dans le user-service
ERROR UserServiceClient - Erreur lors de la vérification de l'utilisateur 1: ...
```

### User Service

Les logs montrent les requêtes reçues :
```
GET /api/users/1
```

---

## 🔐 Sécurité

### Comportement actuel

- **Rejet en cas d'erreur** : Si le user-service n'est pas accessible, la requête est rejetée (sécurisé mais moins résilient)
- **Validation stricte** : Seuls les utilisateurs actifs peuvent créer des posts/comments

### Améliorations possibles

1. **Cache** : Mettre en cache les validations d'utilisateurs pour réduire les appels
2. **Circuit Breaker** : Utiliser Resilience4j pour gérer les pannes du user-service
3. **Fallback** : Accepter les requêtes si le user-service est down (moins sécurisé mais plus résilient)

---

## 📚 Ressources

- **Eureka Documentation** : https://spring.io/projects/spring-cloud-netflix
- **RestTemplate avec LoadBalancer** : https://spring.io/guides/gs/consuming-rest/
- **Microservices Communication** : https://spring.io/guides/gs/multi-module/

---

## ✅ Checklist de vérification

- [ ] Eureka Discovery Server démarré
- [ ] User Service démarré et enregistré dans Eureka
- [ ] Forum Service démarré et enregistré dans Eureka
- [ ] Test de création de post avec userId valide → Succès
- [ ] Test de création de post avec userId invalide → Erreur 400
- [ ] Test de création de comment avec userId valide → Succès
- [ ] Test de création de comment avec userId invalide → Erreur 400

---

## 🎯 Résumé

✅ **Avant** : Il fallait écrire manuellement le `userId` sans validation

✅ **Maintenant** : 
- Le `userId` est automatiquement validé auprès du user-service
- Seuls les utilisateurs existants et actifs peuvent créer des posts/comments
- Communication inter-services via Eureka (découverte automatique)
- Messages d'erreur clairs si l'utilisateur n'existe pas

**Plus besoin d'écrire manuellement l'userId !** 🎉


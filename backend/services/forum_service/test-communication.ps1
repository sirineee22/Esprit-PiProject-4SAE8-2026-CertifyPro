# Script de test pour la communication inter-microservices
# Usage: .\test-communication.ps1

$gatewayUrl = "http://localhost:8081"
$forumUrl = "http://localhost:8084"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Communication Inter-Microservices" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les services sont accessibles
Write-Host "[1/6] Vérification des services..." -ForegroundColor Yellow
try {
    $gatewayTest = Invoke-WebRequest -Uri "$gatewayUrl/api/users" -Method GET -ErrorAction Stop
    Write-Host "✓ API Gateway accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ API Gateway non accessible. Assurez-vous qu'il est démarré sur le port 8081" -ForegroundColor Red
    exit 1
}

try {
    $forumTest = Invoke-WebRequest -Uri "$forumUrl/api/forum/posts" -Method GET -ErrorAction Stop
    Write-Host "✓ Forum Service accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Forum Service non accessible. Assurez-vous qu'il est démarré sur le port 8084" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 2: Créer un utilisateur dans User Service
Write-Host "[2/6] Création d'un utilisateur dans User Service..." -ForegroundColor Yellow
$userData = @{
    firstName = "Test"
    lastName = "User"
    email = "test.user@example.com"
    password = "Password123!"
    active = $true
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri "$gatewayUrl/api/users" -Method POST -Headers $headers -Body $userData
    $userId = $userResponse.id
    Write-Host "✓ Utilisateur créé avec succès (ID: $userId)" -ForegroundColor Green
    Write-Host "  Email: $($userResponse.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur lors de la création de l'utilisateur: $_" -ForegroundColor Red
    Write-Host "  Tentative de récupération d'un utilisateur existant..." -ForegroundColor Yellow
    
    # Essayer de récupérer un utilisateur existant
    try {
        $existingUsers = Invoke-RestMethod -Uri "$gatewayUrl/api/users" -Method GET
        if ($existingUsers.Count -gt 0) {
            $userId = $existingUsers[0].id
            Write-Host "✓ Utilisation de l'utilisateur existant (ID: $userId)" -ForegroundColor Green
        } else {
            Write-Host "✗ Aucun utilisateur trouvé. Veuillez créer un utilisateur manuellement." -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Impossible de récupérer les utilisateurs: $_" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Étape 3: Vérifier que l'utilisateur existe via API Gateway
Write-Host "[3/6] Vérification de l'utilisateur via API Gateway..." -ForegroundColor Yellow
try {
    $userCheck = Invoke-RestMethod -Uri "$gatewayUrl/api/users/$userId" -Method GET
    Write-Host "✓ Utilisateur vérifié via API Gateway" -ForegroundColor Green
    Write-Host "  Nom: $($userCheck.firstName) $($userCheck.lastName)" -ForegroundColor Gray
    Write-Host "  Actif: $($userCheck.active)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur lors de la vérification de l'utilisateur: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 4: Créer un Post avec userId valide
Write-Host "[4/6] Création d'un Post avec userId valide ($userId)..." -ForegroundColor Yellow
$postData = @{
    userId = $userId
    title = "Test de communication inter-microservices"
    content = "Ce post teste la validation automatique du userId via le User Service. Communication: Forum Service → API Gateway → User Service"
} | ConvertTo-Json

try {
    $postResponse = Invoke-RestMethod -Uri "$forumUrl/api/forum/posts" -Method POST -Headers $headers -Body $postData
    $postId = $postResponse.id
    Write-Host "✓ Post créé avec succès (ID: $postId)" -ForegroundColor Green
    Write-Host "  Titre: $($postResponse.title)" -ForegroundColor Gray
    Write-Host "  UserId validé: $($postResponse.userId)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ✅ Communication inter-microservices réussie !" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la création du post: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Réponse: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}
Write-Host ""

# Étape 5: Tester avec userId invalide
Write-Host "[5/6] Test avec userId invalide (validation d'erreur)..." -ForegroundColor Yellow
$invalidPostData = @{
    userId = 999
    title = "Test avec userId invalide"
    content = "Ce post ne devrait pas être créé"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$forumUrl/api/forum/posts" -Method POST -Headers $headers -Body $invalidPostData
    Write-Host "⚠ Le post a été créé alors qu'il ne devrait pas l'être" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✓ Validation fonctionne: Erreur 400 retournée pour userId invalide" -ForegroundColor Green
        Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ Erreur inattendue: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Étape 6: Vérifier le Post créé
Write-Host "[6/6] Vérification du Post créé..." -ForegroundColor Yellow
try {
    $allPosts = Invoke-RestMethod -Uri "$forumUrl/api/forum/posts" -Method GET
    Write-Host "✓ Nombre de posts récupérés: $($allPosts.Count)" -ForegroundColor Green
    
    $createdPost = $allPosts | Where-Object { $_.id -eq $postId }
    if ($createdPost) {
        Write-Host "✓ Post trouvé dans la liste" -ForegroundColor Green
        Write-Host "  ID: $($createdPost.id)" -ForegroundColor Gray
        Write-Host "  Titre: $($createdPost.title)" -ForegroundColor Gray
        Write-Host "  UserId: $($createdPost.userId)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Erreur lors de la récupération des posts: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tests terminés !" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Résumé:" -ForegroundColor Yellow
Write-Host "  - Utilisateur créé/vérifié (ID: $userId)" -ForegroundColor White
Write-Host "  - Post créé avec validation inter-microservices (ID: $postId)" -ForegroundColor White
Write-Host "  - Validation d'erreur testée (userId invalide)" -ForegroundColor White
Write-Host ""
Write-Host "Architecture testée:" -ForegroundColor Yellow
Write-Host "  Forum Service → API Gateway → User Service" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour voir les logs de communication:" -ForegroundColor Yellow
Write-Host "  - Forum Service: Cherchez 'Communication inter-microservices réussie'" -ForegroundColor Gray
Write-Host "  - API Gateway: Cherchez les requêtes vers /api/users/$userId" -ForegroundColor Gray
Write-Host ""



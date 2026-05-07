# Script de test pour les CRUD du Forum Service
# Usage: .\test-forum-crud.ps1

$baseUrl = "http://localhost:8084/api/forum"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test CRUD Forum Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le service est accessible
Write-Host "[1/12] Vérification de la connexion au service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/posts" -Method GET -ErrorAction Stop
    Write-Host "✓ Service accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Service non accessible. Assurez-vous que le service Forum est démarré sur le port 8084" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 1: Créer un Post
Write-Host "[2/12] Test CREATE Post..." -ForegroundColor Yellow
$postData = @{
    userId = 1
    title = "Mon premier post de test"
    content = "Ceci est le contenu de mon premier post créé via le script de test."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts" -Method POST -Headers $headers -Body $postData
    $postId = $response.id
    Write-Host "✓ Post créé avec succès (ID: $postId)" -ForegroundColor Green
    Write-Host "  Titre: $($response.title)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur lors de la création du post: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Récupérer tous les Posts
Write-Host "[3/12] Test READ ALL Posts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts" -Method GET
    Write-Host "✓ Nombre de posts récupérés: $($response.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la récupération des posts: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Récupérer un Post par ID
Write-Host "[4/12] Test READ ONE Post (ID: $postId)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/$postId" -Method GET
    Write-Host "✓ Post récupéré avec succès" -ForegroundColor Green
    Write-Host "  Titre: $($response.title)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur lors de la récupération du post: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Mettre à jour un Post
Write-Host "[5/12] Test UPDATE Post (ID: $postId)..." -ForegroundColor Yellow
$updatePostData = @{
    title = "Post modifié par le script de test"
    content = "Contenu mis à jour via le script de test PowerShell."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/$postId" -Method PUT -Headers $headers -Body $updatePostData
    Write-Host "✓ Post mis à jour avec succès" -ForegroundColor Green
    Write-Host "  Nouveau titre: $($response.title)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur lors de la mise à jour du post: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Créer un Comment sur le Post
Write-Host "[6/12] Test CREATE Comment sur Post (ID: $postId)..." -ForegroundColor Yellow
$commentData = @{
    userId = 2
    content = "Excellent post ! Merci pour le partage. Ce commentaire a été créé via le script de test."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/$postId/comments" -Method POST -Headers $headers -Body $commentData
    $commentId = $response.id
    Write-Host "✓ Comment créé avec succès (ID: $commentId)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la création du comment: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Récupérer tous les Comments d'un Post
Write-Host "[7/12] Test READ ALL Comments du Post (ID: $postId)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts/$postId/comments" -Method GET
    Write-Host "✓ Nombre de comments récupérés: $($response.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la récupération des comments: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Récupérer un Comment par ID
Write-Host "[8/12] Test READ ONE Comment (ID: $commentId)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method GET
    Write-Host "✓ Comment récupéré avec succès" -ForegroundColor Green
    Write-Host "  Contenu: $($response.content.Substring(0, [Math]::Min(50, $response.content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur lors de la récupération du comment: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Mettre à jour un Comment
Write-Host "[9/12] Test UPDATE Comment (ID: $commentId)..." -ForegroundColor Yellow
$updateCommentData = @{
    content = "Commentaire modifié via le script de test PowerShell."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method PUT -Headers $headers -Body $updateCommentData
    Write-Host "✓ Comment mis à jour avec succès" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la mise à jour du comment: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: Créer un deuxième Post pour tester le cascade delete
Write-Host "[10/12] Création d'un deuxième Post pour test cascade delete..." -ForegroundColor Yellow
$postData2 = @{
    userId = 1
    title = "Post à supprimer avec cascade"
    content = "Ce post sera supprimé avec ses comments."
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/posts" -Method POST -Headers $headers -Body $postData2
    $postId2 = $response2.id
    Write-Host "✓ Deuxième post créé (ID: $postId2)" -ForegroundColor Green
    
    # Créer 2 comments sur ce post
    $commentData2 = @{
        userId = 3
        content = "Commentaire 1 sur le post à supprimer"
    } | ConvertTo-Json
    $comment1 = Invoke-RestMethod -Uri "$baseUrl/posts/$postId2/comments" -Method POST -Headers $headers -Body $commentData2
    
    $commentData3 = @{
        userId = 4
        content = "Commentaire 2 sur le post à supprimer"
    } | ConvertTo-Json
    $comment2 = Invoke-RestMethod -Uri "$baseUrl/posts/$postId2/comments" -Method POST -Headers $headers -Body $commentData3
    
    Write-Host "✓ 2 comments créés sur le post $postId2" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 10: Vérifier les comments avant suppression
Write-Host "[11/12] Vérification des comments avant suppression du post..." -ForegroundColor Yellow
try {
    $commentsBefore = Invoke-RestMethod -Uri "$baseUrl/posts/$postId2/comments" -Method GET
    Write-Host "✓ Nombre de comments avant suppression: $($commentsBefore.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur: $_" -ForegroundColor Red
}
Write-Host ""

# Test 11: Supprimer le Post (cascade delete)
Write-Host "[12/12] Test DELETE Post avec cascade delete (ID: $postId2)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/posts/$postId2" -Method DELETE
    Write-Host "✓ Post supprimé avec succès" -ForegroundColor Green
    
    # Vérifier que les comments ont été supprimés
    Start-Sleep -Seconds 1
    $commentsAfter = Invoke-RestMethod -Uri "$baseUrl/posts/$postId2/comments" -Method GET
    if ($commentsAfter.Count -eq 0) {
        Write-Host "✓ Cascade delete fonctionne: les comments ont été supprimés automatiquement" -ForegroundColor Green
    } else {
        Write-Host "⚠ Cascade delete ne fonctionne pas: $($commentsAfter.Count) comments restants" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Erreur lors de la suppression: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tests terminés !" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Résumé:" -ForegroundColor Yellow
Write-Host "  - Post créé (ID: $postId)" -ForegroundColor White
Write-Host "  - Comment créé (ID: $commentId)" -ForegroundColor White
Write-Host "  - Post de test cascade supprimé (ID: $postId2)" -ForegroundColor White
Write-Host ""
Write-Host "Pour nettoyer les données de test:" -ForegroundColor Yellow
Write-Host "  curl -X DELETE $baseUrl/posts/$postId" -ForegroundColor Gray
Write-Host "  curl -X DELETE $baseUrl/comments/$commentId" -ForegroundColor Gray
Write-Host ""


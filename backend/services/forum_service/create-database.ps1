# Script pour créer la base de données forumdb
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création de la base de données forumdb" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Méthode 1: Essayer avec psql dans le PATH
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "✓ psql trouvé: $($psqlPath.Source)" -ForegroundColor Green
    Write-Host "Création de la base de données..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = "root"
    $result = & psql -U postgres -c "CREATE DATABASE forumdb;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Base de données 'forumdb' créée avec succès !" -ForegroundColor Green
    } else {
        # Vérifier si la base existe déjà
        $checkResult = & psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='forumdb';" -t 2>&1
        if ($checkResult -match "1") {
            Write-Host "✓ La base de données 'forumdb' existe déjà." -ForegroundColor Yellow
        } else {
            Write-Host "✗ Erreur lors de la création:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            Write-Host ""
            Write-Host "Veuillez créer la base de données manuellement:" -ForegroundColor Yellow
            Write-Host "1. Ouvrir pgAdmin ou un client PostgreSQL" -ForegroundColor White
            Write-Host "2. Se connecter au serveur PostgreSQL" -ForegroundColor White
            Write-Host "3. Exécuter: CREATE DATABASE forumdb;" -ForegroundColor White
        }
    }
} else {
    Write-Host "✗ psql n'est pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options pour créer la base de données:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Utiliser pgAdmin (GUI)" -ForegroundColor Cyan
    Write-Host "  1. Ouvrir pgAdmin" -ForegroundColor White
    Write-Host "  2. Se connecter au serveur PostgreSQL" -ForegroundColor White
    Write-Host "  3. Clic droit sur 'Databases' > Create > Database" -ForegroundColor White
    Write-Host "  4. Nom: forumdb" -ForegroundColor White
    Write-Host "  5. Cliquer sur 'Save'" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Utiliser SQL Shell (psql)" -ForegroundColor Cyan
    Write-Host "  1. Ouvrir 'SQL Shell (psql)' depuis le menu Démarrer" -ForegroundColor White
    Write-Host "  2. Appuyer sur Entrée pour chaque question (utiliser les valeurs par défaut)" -ForegroundColor White
    Write-Host "  3. Exécuter: CREATE DATABASE forumdb;" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Ajouter psql au PATH" -ForegroundColor Cyan
    Write-Host "  Trouver le chemin d'installation PostgreSQL (ex: C:\Program Files\PostgreSQL\15\bin)" -ForegroundColor White
    Write-Host "  Ajouter ce chemin à la variable d'environnement PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 4: Utiliser Docker (si PostgreSQL est dans Docker)" -ForegroundColor Cyan
    Write-Host "  docker exec -it <container_name> psql -U postgres -c 'CREATE DATABASE forumdb;'" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Une fois la base créée, vous pouvez démarrer le service avec:" -ForegroundColor Cyan
Write-Host "  .\start-forum-service.ps1" -ForegroundColor White
Write-Host ""


# Script de verification de l'environnement CI/CD
# Usage: .\check-setup.ps1

Write-Host "Verification de l'environnement CI/CD..." -ForegroundColor Cyan
Write-Host ""

# Verifier Docker
Write-Host "Verification de Docker..." -NoNewline
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Version: $dockerVersion" -ForegroundColor Gray
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "  Docker n'est pas installe" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verifier le reseau Docker
Write-Host "Verification du reseau Docker..." -NoNewline
$network = docker network ls --filter "name=certifypro-net" --format "{{.Name}}"
if ($network -eq "certifypro-net") {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "  Creez-le avec: docker network create certifypro-net" -ForegroundColor Yellow
}

Write-Host ""

# Verifier Jenkins
Write-Host "Verification de Jenkins..." -NoNewline
$jenkinsStatus = docker ps --filter "name=jenkins" --format "{{.Status}}"
if ($jenkinsStatus -match "Up") {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  URL: http://localhost:9090" -ForegroundColor Gray
    $jenkinsOk = $true
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "  Le conteneur n'est pas en cours d'execution" -ForegroundColor Red
    $jenkinsOk = $false
}

Write-Host ""

# Verifier SonarQube
Write-Host "Verification de SonarQube..." -NoNewline
$sonarStatus = docker ps --filter "name=sonarqube" --format "{{.Status}}"
if ($sonarStatus -match "Up") {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  URL: http://localhost:9000" -ForegroundColor Gray
    $sonarOk = $true
} else {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "  Le conteneur n'est pas en cours d'execution" -ForegroundColor Red
    $sonarOk = $false
}

Write-Host ""

# Verifier si SonarQube est operationnel
if ($sonarOk) {
    Write-Host "Verification de l'etat de SonarQube..." -NoNewline
    $sonarLogs = docker logs sonarqube 2>&1 | Select-String "SonarQube is operational" | Select-Object -Last 1
    if ($sonarLogs) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  SonarQube est operationnel" -ForegroundColor Gray
    } else {
        Write-Host " EN COURS" -ForegroundColor Yellow
        Write-Host "  SonarQube est en cours de demarrage..." -ForegroundColor Yellow
        Write-Host "  Attends 1-2 minutes et reessaye" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Resume
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($jenkinsOk -and $sonarOk) {
    Write-Host "Tous les services sont operationnels !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes :" -ForegroundColor Cyan
    Write-Host "  1. Ouvre Jenkins: http://localhost:9090" -ForegroundColor White
    Write-Host "  2. Ouvre SonarQube: http://localhost:9000" -ForegroundColor White
    Write-Host "  3. Suis le guide: QUICK_START.md" -ForegroundColor White
} else {
    Write-Host "Certains services ne sont pas operationnels" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions requises :" -ForegroundColor Cyan
    
    if (-not $jenkinsOk) {
        Write-Host "  Demarre Jenkins:" -ForegroundColor White
        Write-Host "    docker run -d --name jenkins --network certifypro-net -p 9090:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17" -ForegroundColor Gray
    }
    
    if (-not $sonarOk) {
        Write-Host "  Demarre SonarQube:" -ForegroundColor White
        Write-Host "    docker run -d --name sonarqube --network certifypro-net -p 9000:9000 -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true sonarqube:lts-community" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

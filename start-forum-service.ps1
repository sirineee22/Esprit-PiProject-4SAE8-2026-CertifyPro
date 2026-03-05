# Script to start Forum Service
Write-Host "Starting Forum Service..." -ForegroundColor Green

# Add Maven to PATH if not already there
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    $mavenPath = "C:\Maven\apache-maven-3.9.12\bin"
    if (Test-Path $mavenPath) {
        $env:PATH += ";$mavenPath"
        Write-Host "Added Maven to PATH: $mavenPath" -ForegroundColor Yellow
    }
}

# Check if Maven is available
$mvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
if (-not $mvnCmd) {
    Write-Host "ERROR: Maven (mvn) is not found in PATH!" -ForegroundColor Red
    Write-Host "Please install Maven or add it to your PATH." -ForegroundColor Yellow
    pause
    exit 1
}

Set-Location "$PSScriptRoot\backend\services\forum_service"
Write-Host "Running: mvn spring-boot:run" -ForegroundColor Cyan
mvn spring-boot:run



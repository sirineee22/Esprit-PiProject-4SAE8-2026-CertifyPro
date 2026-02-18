# Script to start Discovery Server
Write-Host "Starting Discovery Server (Eureka)..." -ForegroundColor Green

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
    Write-Host ""
    Write-Host "To install Maven:" -ForegroundColor Cyan
    Write-Host "1. Download from: https://maven.apache.org/download.cgi" -ForegroundColor White
    Write-Host "2. Extract to C:\Program Files\Apache\maven" -ForegroundColor White
    Write-Host "3. Add C:\Program Files\Apache\maven\bin to your PATH environment variable" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Chocolatey: choco install maven" -ForegroundColor White
    pause
    exit 1
}

Set-Location "$PSScriptRoot\backend\discovery-server"
Write-Host "Running: mvn spring-boot:run" -ForegroundColor Cyan
mvn spring-boot:run


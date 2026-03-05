# Script to start all services
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting All CertifyPro Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
    Write-Host ""
    Write-Host "Please install Maven first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Using Chocolatey (Recommended)" -ForegroundColor Cyan
    Write-Host "  choco install maven" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Manual Installation" -ForegroundColor Cyan
    Write-Host "  1. Download from: https://maven.apache.org/download.cgi" -ForegroundColor White
    Write-Host "  2. Extract to C:\Program Files\Apache\maven" -ForegroundColor White
    Write-Host "  3. Add C:\Program Files\Apache\maven\bin to your PATH" -ForegroundColor White
    Write-Host "  4. Restart your terminal" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "Maven found: $($mvnCmd.Source)" -ForegroundColor Green
Write-Host ""

# Start Discovery Server
Write-Host "[1/4] Starting Discovery Server (Eureka) on port 8761..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-discovery-server.ps1"
Start-Sleep -Seconds 3

# Start User Service
Write-Host "[2/4] Starting User Service on port 8083..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-user-service.ps1"
Start-Sleep -Seconds 3

# Start Forum Service
Write-Host "[3/4] Starting Forum Service on port 8084..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-forum-service.ps1"
Start-Sleep -Seconds 3

# Start API Gateway
Write-Host "[4/4] Starting API Gateway on port 8081..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-api-gateway.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services are starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 1-2 minutes for all services to start, then:" -ForegroundColor Cyan
Write-Host "  - Check Eureka: http://localhost:8761" -ForegroundColor White
Write-Host "  - You should see API-GATEWAY and USER-SERVICE registered" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window (services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


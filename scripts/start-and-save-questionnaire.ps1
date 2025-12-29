# PowerShell script to start the application and save Hebrew questionnaire
# This script starts the development server and opens the save questionnaire page

param(
    [switch]$SkipStart,
    [switch]$Help,
    [string]$Port = "5173"
)

if ($Help) {
    Write-Host @"
Hebrew Questionnaire Full Setup Script

DESCRIPTION:
    Starts the React development server and opens the Hebrew questionnaire save page.
    
SYNTAX:
    .\start-and-save-questionnaire.ps1 [-SkipStart] [-Port <port>] [-Help]

PARAMETERS:
    -SkipStart      Skip starting the development server (if already running)
    -Port <port>    Specify the port number (default: 5173)
    -Help           Show this help message

EXAMPLES:
    .\start-and-save-questionnaire.ps1
    .\start-and-save-questionnaire.ps1 -SkipStart
    .\start-and-save-questionnaire.ps1 -Port 3000

"@ -ForegroundColor White
    exit 0
}

# Change to the my-app directory
$appPath = Join-Path $PSScriptRoot "..\my-app"
if (-not (Test-Path $appPath)) {
    Write-Host "❌ Could not find my-app directory at: $appPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Hebrew Questionnaire Setup" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

if (-not $SkipStart) {
    Write-Host "📦 Starting React development server..." -ForegroundColor Cyan
    
    # Check if package.json exists
    $packageJsonPath = Join-Path $appPath "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-Host "❌ package.json not found at: $packageJsonPath" -ForegroundColor Red
        exit 1
    }
    
    # Start the development server in a new window
    try {
        $startCmd = "npm run dev"
        Write-Host "🔧 Running: $startCmd in $appPath" -ForegroundColor Gray
        
        # Start the server in a new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$appPath'; $startCmd" -WindowStyle Normal
        
        Write-Host "✅ Development server starting in new window..." -ForegroundColor Green
        Write-Host "⏳ Waiting 10 seconds for server to start..." -ForegroundColor Yellow
        
        # Wait for the server to start
        Start-Sleep -Seconds 10
        
    } catch {
        Write-Host "❌ Failed to start development server: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping development server start (assuming it's already running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Opening questionnaire save page..." -ForegroundColor Cyan

# Call the other script to open the browser
$saveScriptPath = Join-Path $PSScriptRoot "save-hebrew-questionnaire.ps1"
if (Test-Path $saveScriptPath) {
    & $saveScriptPath -Port $Port
} else {
    Write-Host "❌ Could not find save-hebrew-questionnaire.ps1 script" -ForegroundColor Red
    
    # Fallback: open the URL directly
    $url = "http://localhost:$Port/layout/save-hebrew-questionnaire"
    try {
        Start-Process $url
        Write-Host "✅ Opened browser to: $url" -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not open browser. Please navigate to: $url" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for the page to load" -ForegroundColor White
Write-Host "2. Log in as an Admin user if not already logged in" -ForegroundColor White
Write-Host "3. Validate and save the Hebrew questionnaire" -ForegroundColor White

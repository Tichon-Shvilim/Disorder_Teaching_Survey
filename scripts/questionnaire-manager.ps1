# Main PowerShell script for Hebrew Questionnaire Management
# Uses the HebrewQuestionnaireUtils module for comprehensive management

param(
    [ValidateSet("status", "start", "start-services", "start-react", "open", "full", "help")]
    [string]$Action = "help",
    [switch]$SkipMicroservices,
    [switch]$SkipReact,
    [int]$Port = 5173
)

# Import the utilities module
$moduleFile = Join-Path $PSScriptRoot "HebrewQuestionnaireUtils.psm1"
if (Test-Path $moduleFile) {
    Import-Module $moduleFile -Force
} else {
    Write-Host "❌ Could not find HebrewQuestionnaireUtils.psm1 module" -ForegroundColor Red
    exit 1
}

# Display header
Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                 Hebrew Questionnaire Manager                 ║
║              שאלון הוראה לילדים עם הפרעות                   ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

# Execute the requested action
switch ($Action) {
    "status" {
        Write-Host "🔍 Checking application status..." -ForegroundColor Yellow
        Get-ApplicationStatus
    }
    
    "start" {
        Write-Host "🚀 Starting complete environment..." -ForegroundColor Yellow
        Start-CompleteEnvironment -SkipMicroservices:$SkipMicroservices -SkipReact:$SkipReact -Port $Port
    }
    
    "start-services" {
        Write-Host "📦 Starting microservices only..." -ForegroundColor Yellow
        Start-Microservices
    }
    
    "start-react" {
        Write-Host "⚛️  Starting React app only..." -ForegroundColor Yellow
        Start-ReactApp
    }
    
    "open" {
        Write-Host "🌐 Opening questionnaire page..." -ForegroundColor Yellow
        Open-QuestionnairePage -Port $Port
    }
    
    "full" {
        Write-Host "🎯 Full setup with status check..." -ForegroundColor Yellow
        Write-Host ""
        
        # First check status
        Get-ApplicationStatus
        Write-Host ""
        
        # Then start everything
        Start-CompleteEnvironment -SkipMicroservices:$SkipMicroservices -SkipReact:$SkipReact -Port $Port
        
        Write-Host ""
        Write-Host "🔄 Final status check..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        Get-ApplicationStatus
    }
    
    "help" {
        Show-QuestionnaireInstructions
        Write-Host ""
        Write-Host "USAGE:" -ForegroundColor Green
        Write-Host "    .\questionnaire-manager.ps1 <action> [options]" -ForegroundColor White
        Write-Host ""
        Write-Host "ACTIONS:" -ForegroundColor Green
        Write-Host "    status          - Check if services are running" -ForegroundColor White
        Write-Host "    start           - Start complete environment" -ForegroundColor White  
        Write-Host "    start-services  - Start microservices only" -ForegroundColor White
        Write-Host "    start-react     - Start React app only" -ForegroundColor White
        Write-Host "    open            - Open questionnaire page (if app running)" -ForegroundColor White
        Write-Host "    full            - Complete setup with status checks" -ForegroundColor White
        Write-Host "    help            - Show this help" -ForegroundColor White
        Write-Host ""
        Write-Host "OPTIONS:" -ForegroundColor Green
        Write-Host "    -SkipMicroservices  Skip starting microservices" -ForegroundColor White
        Write-Host "    -SkipReact          Skip starting React app" -ForegroundColor White
        Write-Host "    -Port <number>      Specify port (default: 5173)" -ForegroundColor White
        Write-Host ""
        Write-Host "EXAMPLES:" -ForegroundColor Green
        Write-Host "    .\questionnaire-manager.ps1 status" -ForegroundColor Gray
        Write-Host "    .\questionnaire-manager.ps1 full" -ForegroundColor Gray
        Write-Host "    .\questionnaire-manager.ps1 start -SkipMicroservices" -ForegroundColor Gray
        Write-Host "    .\questionnaire-manager.ps1 open -Port 3000" -ForegroundColor Gray
    }
    
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Write-Host "Use 'help' to see available actions." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✨ Script completed." -ForegroundColor Green

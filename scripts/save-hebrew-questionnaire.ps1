# PowerShell script to save Hebrew questionnaire to MongoDB
# This script opens the browser to the save questionnaire page

param(
    [string]$Port = "5173",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Hebrew Questionnaire Save Script

DESCRIPTION:
    Opens the Hebrew questionnaire save page in your default browser.
    Requires the application to be running and an Admin user login.

SYNTAX:
    .\save-hebrew-questionnaire.ps1 [-Port <port>] [-Help]

PARAMETERS:
    -Port <port>    Specify the port number (default: 5173)
    -Help           Show this help message

EXAMPLES:
    .\save-hebrew-questionnaire.ps1
    .\save-hebrew-questionnaire.ps1 -Port 3000

"@ -ForegroundColor White
    exit 0
}

Write-Host "🚀 Opening Save Hebrew Questionnaire page..." -ForegroundColor Green
Write-Host "📋 Make sure your application is running on http://localhost:$Port" -ForegroundColor Yellow
Write-Host "🔐 You need to be logged in as an Admin user" -ForegroundColor Yellow
Write-Host ""

# Define the URL
$url = "http://localhost:$Port/layout/save-hebrew-questionnaire"

# Try to open the URL in the default browser
try {
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        # Windows
        Start-Process $url -ErrorAction Stop
    } elseif ($IsMacOS) {
        # macOS
        & open $url
    } elseif ($IsLinux) {
        # Linux
        & xdg-open $url
    } else {
        # Fallback
        Start-Process $url -ErrorAction Stop
    }
    
    Write-Host "✅ Browser opened successfully" -ForegroundColor Green
    Write-Host "🌐 Navigating to: $url" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Could not open browser automatically" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please manually open your browser and navigate to:" -ForegroundColor Yellow
    Write-Host $url -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Instructions:" -ForegroundColor Cyan
Write-Host "1. Log in as an Admin user" -ForegroundColor White
Write-Host "2. Click 'בדוק תקינות השאלון' to validate the questionnaire" -ForegroundColor White
Write-Host "3. Click 'שמור שאלון למסד הנתונים' to save it to MongoDB" -ForegroundColor White
Write-Host "4. The questionnaire will be saved with all 13 groups and questions" -ForegroundColor White

Write-Host ""
Write-Host "📊 Questionnaire Details:" -ForegroundColor Cyan
$questionnaireDetails = @(
    "• Title: שאלון הוראה לילדים עם הפרעות",
    "• Groups: 13",
    "• Total Questions: 15", 
    "• All questions are graphable for analytics",
    "• Rating Scale: 1-5 points per question",
    "• Language: Hebrew (RTL support)"
)

foreach ($detail in $questionnaireDetails) {
    Write-Host $detail -ForegroundColor White
}

Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Cyan
Write-Host "• If page doesn't load: Check if app is running with 'npm run dev'" -ForegroundColor Gray
Write-Host "• If access denied: Ensure you're logged in as an Admin user" -ForegroundColor Gray
Write-Host "• If save fails: Check MongoDB connection and server logs" -ForegroundColor Gray

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

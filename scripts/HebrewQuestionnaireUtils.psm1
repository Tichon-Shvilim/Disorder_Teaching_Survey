# PowerShell Module for Hebrew Questionnaire Utilities
# Contains functions for managing the Hebrew questionnaire system

<#
.SYNOPSIS
    Utilities for managing Hebrew questionnaire in the Disorder Teaching Survey system.

.DESCRIPTION
    This module provides PowerShell functions to help manage the Hebrew questionnaire
    for teaching children with disorders. Includes functions for starting the app,
    checking services, and managing the questionnaire.

.NOTES
    Author: Generated for Disorder Teaching Survey
    Version: 1.0
#>

# Function to check if a port is in use
function Test-PortInUse {
    param(
        [int]$Port
    )
    
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Function to check application status
function Get-ApplicationStatus {
    param(
        [int]$ReactPort = 5173,
        [int]$UserServicePort = 4001,
        [int]$StudentServicePort = 4002,
        [int]$FormServicePort = 4003,
        [int]$AnalyticsServicePort = 4004
    )
    
    $status = @{
        React = Test-PortInUse -Port $ReactPort
        UserService = Test-PortInUse -Port $UserServicePort
        StudentService = Test-PortInUse -Port $StudentServicePort
        FormService = Test-PortInUse -Port $FormServicePort
        AnalyticsService = Test-PortInUse -Port $AnalyticsServicePort
    }
    
    Write-Host "🔍 Application Status Check:" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    foreach ($service in $status.GetEnumerator()) {
        $icon = if ($service.Value) { "✅" } else { "❌" }
        $color = if ($service.Value) { "Green" } else { "Red" }
        Write-Host "$icon $($service.Key): $($service.Value)" -ForegroundColor $color
    }
    
    return $status
}

# Function to start microservices
function Start-Microservices {
    param(
        [string]$ProjectRoot = (Get-Location)
    )
    
    Write-Host "🚀 Starting microservices..." -ForegroundColor Green
    
    $services = @(
        @{ Name = "User Service"; Path = "microservices\user-service"; Port = 4001 },
        @{ Name = "Student Service"; Path = "microservices\student-service"; Port = 4002 },
        @{ Name = "Form Service"; Path = "microservices\form-service"; Port = 4003 },
        @{ Name = "Analytics Service"; Path = "microservices\analytics-service"; Port = 4004 }
    )
    
    foreach ($service in $services) {
        $servicePath = Join-Path $ProjectRoot $service.Path
        if (Test-Path $servicePath) {
            Write-Host "📦 Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
            
            # Start each service in a new PowerShell window
            $startCmd = "cd '$servicePath'; npm start"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $startCmd -WindowStyle Minimized
            
            Start-Sleep -Seconds 2
        } else {
            Write-Host "❌ Service path not found: $servicePath" -ForegroundColor Red
        }
    }
    
    Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Function to start React application
function Start-ReactApp {
    param(
        [string]$AppPath = "my-app"
    )
    
    $fullAppPath = Join-Path (Get-Location) $AppPath
    
    if (-not (Test-Path $fullAppPath)) {
        Write-Host "❌ React app path not found: $fullAppPath" -ForegroundColor Red
        return $false
    }
    
    Write-Host "⚛️  Starting React development server..." -ForegroundColor Cyan
    
    $startCmd = "cd '$fullAppPath'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $startCmd -WindowStyle Normal
    
    Write-Host "✅ React app starting..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    
    return $true
}

# Function to open questionnaire save page
function Open-QuestionnairePage {
    param(
        [int]$Port = 5173
    )
    
    $url = "http://localhost:$Port/layout/save-hebrew-questionnaire"
    
    Write-Host "🌐 Opening questionnaire page: $url" -ForegroundColor Cyan
    
    try {
        Start-Process $url
        return $true
    } catch {
        Write-Host "❌ Failed to open browser: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please manually navigate to: $url" -ForegroundColor Yellow
        return $false
    }
}

# Function to setup complete environment
function Start-CompleteEnvironment {
    param(
        [switch]$SkipMicroservices,
        [switch]$SkipReact,
        [int]$Port = 5173
    )
    
    Write-Host "🎯 Setting up complete Hebrew questionnaire environment..." -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host ""
    
    # Check current status
    $status = Get-ApplicationStatus
    Write-Host ""
    
    # Start microservices if needed
    if (-not $SkipMicroservices -and -not ($status.UserService -and $status.FormService)) {
        Start-Microservices
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping microservices (already running or skipped)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Start React app if needed
    if (-not $SkipReact -and -not $status.React) {
        Start-ReactApp
        Write-Host ""
    } else {
        Write-Host "⏭️  Skipping React app (already running or skipped)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Wait a bit more for everything to settle
    Write-Host "⏳ Waiting for all services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Open the questionnaire page
    Open-QuestionnairePage -Port $Port
    
    Write-Host ""
    Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
    Write-Host "📝 Ready to save Hebrew questionnaire to MongoDB" -ForegroundColor Cyan
}

# Function to display usage instructions
function Show-QuestionnaireInstructions {
    Write-Host @"
🌟 Hebrew Questionnaire Management Instructions
===============================================

AVAILABLE COMMANDS:
    Get-ApplicationStatus       - Check if all services are running
    Start-Microservices        - Start all backend microservices  
    Start-ReactApp             - Start the React frontend
    Open-QuestionnairePage     - Open the questionnaire save page
    Start-CompleteEnvironment  - Setup complete environment
    Show-QuestionnaireInstructions - Show this help

EXAMPLES:
    # Check what's running
    Get-ApplicationStatus
    
    # Start everything
    Start-CompleteEnvironment
    
    # Start without microservices (if already running)
    Start-CompleteEnvironment -SkipMicroservices
    
    # Just open the page (if app is running)
    Open-QuestionnairePage

QUESTIONNAIRE DETAILS:
    • Title: שאלון הוראה לילדים עם הפרעות
    • Groups: 13 question groups
    • Questions: 15 total questions  
    • Language: Hebrew (RTL support)
    • Analytics: All questions are graphable
    • Scale: 1-5 rating scale

TROUBLESHOOTING:
    • If services fail to start: Check if ports 4001-4004 are available
    • If React fails: Ensure npm is installed and dependencies are up to date
    • If page doesn't load: Verify you're logged in as Admin user
    • If save fails: Check MongoDB connection and server logs

"@ -ForegroundColor White
}

# Export functions
Export-ModuleMember -Function @(
    'Test-PortInUse',
    'Get-ApplicationStatus', 
    'Start-Microservices',
    'Start-ReactApp',
    'Open-QuestionnairePage',
    'Start-CompleteEnvironment',
    'Show-QuestionnaireInstructions'
)

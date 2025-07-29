# Production Testing Script for Local Environment
# This script tests the production Docker builds locally before deploying to Render

param(
    [switch]$Clean,
    [switch]$SkipBuild,
    [switch]$Verbose
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param($Message, $Color = "White")
    Write-Host "🔍 $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️ $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️ $Message" -ForegroundColor $Blue
}

# Cleanup function
function Cleanup-Test {
    Write-Status "Cleaning up test containers and networks..." $Yellow
    
    try {
        docker-compose -f docker-compose.prod.yml down --remove-orphans --volumes 2>$null
        Write-Success "Cleanup completed"
    }
    catch {
        Write-Warning "Some cleanup operations failed (this is often normal)"
    }
}

# Check prerequisites
function Check-Prerequisites {
    Write-Status "Checking prerequisites..." $Blue
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker found: $dockerVersion"
    }
    catch {
        Write-Error "Docker not found. Please install Docker Desktop."
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose found: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose not found. Please install Docker Compose."
        exit 1
    }
    
    # Check .env.prod file
    if (Test-Path ".env.prod") {
        Write-Success "Production environment file found"
    }
    else {
        Write-Error "Production environment file (.env.prod) not found!"
        Write-Info "Please create .env.prod with your MongoDB Atlas connection strings"
        exit 1
    }
}

# Build production images
function Build-ProductionImages {
    if ($SkipBuild) {
        Write-Status "Skipping build (--SkipBuild flag set)" $Yellow
        return
    }
    
    Write-Status "Building production Docker images..." $Blue
    
    $services = @("user-service", "student-service", "form-service", "analytics-service", "frontend")
    
    foreach ($service in $services) {
        Write-Status "Building $service..." $Blue
        
        try {
            if ($service -eq "frontend") {
                $context = "./my-app"
            }
            else {
                $context = "./microservices/$service"
            }
            
            $buildResult = docker build -f "$context/Dockerfile.prod" -t "disorder-survey-$service:test" $context
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$service built successfully"
            }
            else {
                Write-Error "$service build failed"
                return $false
            }
        }
        catch {
            Write-Error "Failed to build ${service}: $($_.Exception.Message)"
            return $false
        }
    }
    
    Write-Success "All production images built successfully!"
    return $true
}

# Test database connectivity
function Test-DatabaseConnection {
    Write-Status "Testing MongoDB Atlas connectivity..." $Blue
    
    # Create a simple test script
    $testScript = @"
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI || process.env.USER_DB_URI;

if (!mongoUri) {
    console.error('No MongoDB URI found in environment');
    process.exit(1);
}

console.log('Testing connection to:', mongoUri.replace(/\/\/.*@/, '//***:***@'));

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('✅ Database connection successful!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });

setTimeout(() => {
    console.error('❌ Database connection timeout');
    process.exit(1);
}, 10000);
"@
    
    # Save test script temporarily
    $testScript | Out-File -FilePath "temp-db-test.js" -Encoding UTF8
    
    try {
        # Test with user-service environment
        $env:MONGODB_URI = (Get-Content .env.prod | Where-Object { $_ -match "^USER_DB_URI=" }) -replace "USER_DB_URI=", ""
        
        if ($env:MONGODB_URI) {
            $result = docker run --rm -v "${PWD}:/app" -w /app -e "MONGODB_URI=$env:MONGODB_URI" node:20-alpine sh -c "npm install mongoose >/dev/null 2>&1 && node temp-db-test.js"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Database connectivity test passed!"
            }
            else {
                Write-Error "Database connectivity test failed!"
                Write-Warning "Please check your MongoDB Atlas connection string and network access settings"
                return $false
            }
        }
        else {
            Write-Error "Could not find USER_DB_URI in .env.prod file"
            return $false
        }
    }
    catch {
        Write-Error "Database test failed: $($_.Exception.Message)"
        return $false
    }
    finally {
        # Clean up test file
        if (Test-Path "temp-db-test.js") {
            Remove-Item "temp-db-test.js" -Force
        }
    }
    
    return $true
}

# Start services and test
function Start-AndTestServices {
    Write-Status "Starting production services..." $Blue
    
    try {
        # Start services in background
        docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start services"
            return $false
        }
        
        Write-Success "Services started, waiting for health checks..."
        
        # Wait for services to be healthy
        $services = @("user-service", "student-service", "form-service", "analytics-service")
        $maxWait = 120 # 2 minutes
        $waited = 0
        
        do {
            Start-Sleep -Seconds 5
            $waited += 5
            
            $allHealthy = $true
            foreach ($service in $services) {
                $health = docker-compose -f docker-compose.prod.yml ps --services --filter "health=healthy" | Where-Object { $_ -eq $service }
                if (-not $health) {
                    $allHealthy = $false
                    break
                }
            }
            
            if ($allHealthy) {
                Write-Success "All services are healthy!"
                break
            }
            
            Write-Status "Waiting for services to become healthy... ($waited/$maxWait seconds)" $Yellow
            
        } while ($waited -lt $maxWait)
        
        if (-not $allHealthy) {
            Write-Error "Services did not become healthy within $maxWait seconds"
            Write-Info "Checking service logs..."
            docker-compose -f docker-compose.prod.yml logs --tail=20
            return $false
        }
        
        return $true
    }
    catch {
        Write-Error "Failed to start and test services: $($_.Exception.Message)"
        return $false
    }
}

# Test health endpoints
function Test-HealthEndpoints {
    Write-Status "Testing health endpoints..." $Blue
    
    $endpoints = @(
        @{ Service = "user-service"; Port = 3001 },
        @{ Service = "student-service"; Port = 3002 },
        @{ Service = "form-service"; Port = 3003 },
        @{ Service = "analytics-service"; Port = 3004 }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($endpoint.Port)/healthz" -TimeoutSec 10 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Success "$($endpoint.Service) health check passed"
            }
            else {
                Write-Error "$($endpoint.Service) health check failed (Status: $($response.StatusCode))"
                return $false
            }
        }
        catch {
            Write-Error "$($endpoint.Service) health check failed: $($_.Exception.Message)"
            return $false
        }
    }
    
    return $true
}

# Show service status
function Show-ServiceStatus {
    Write-Status "Service Status:" $Blue
    Write-Host ""
    
    try {
        docker-compose -f docker-compose.prod.yml ps
        Write-Host ""
        
        Write-Info "You can test your services at:"
        Write-Host "  • User Service:      http://localhost:3001/healthz" -ForegroundColor $Blue
        Write-Host "  • Student Service:   http://localhost:3002/healthz" -ForegroundColor $Blue
        Write-Host "  • Form Service:      http://localhost:3003/healthz" -ForegroundColor $Blue
        Write-Host "  • Analytics Service: http://localhost:3004/healthz" -ForegroundColor $Blue
        Write-Host "  • Frontend:          http://localhost:80" -ForegroundColor $Blue
        Write-Host ""
        
        Write-Info "To view logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
        Write-Info "To stop services: docker-compose -f docker-compose.prod.yml down"
    }
    catch {
        Write-Warning "Could not show service status"
    }
}

# Main execution
Write-Host ""
Write-Host "===========================================" -ForegroundColor $Green
Write-Host "🚀 Production Testing for Disorder Survey" -ForegroundColor $Green
Write-Host "===========================================" -ForegroundColor $Green
Write-Host ""

if ($Clean) {
    Cleanup-Test
    Write-Host "Cleanup completed. Exiting." -ForegroundColor $Green
    exit 0
}

# Run tests
$success = $true

$success = $success -and (Check-Prerequisites)
if (-not $success) { exit 1 }

$success = $success -and (Test-DatabaseConnection)
if (-not $success) { exit 1 }

$success = $success -and (Build-ProductionImages)
if (-not $success) { exit 1 }

$success = $success -and (Start-AndTestServices)
if (-not $success) { 
    Write-Error "Service startup failed. Cleaning up..."
    Cleanup-Test
    exit 1 
}

$success = $success -and (Test-HealthEndpoints)

if ($success) {
    Write-Host ""
    Write-Success "🎉 All production tests passed! Your setup is ready for deployment."
    Write-Host ""
    Show-ServiceStatus
    Write-Host ""
    Write-Warning "Remember to run 'docker-compose -f docker-compose.prod.yml down' when you're done testing"
}
else {
    Write-Host ""
    Write-Error "❌ Some tests failed. Please check the errors above."
    Write-Info "Running cleanup..."
    Cleanup-Test
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor $Green

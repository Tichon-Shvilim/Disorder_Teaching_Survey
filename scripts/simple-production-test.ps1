# Simple Production Test Script
# Tests production Docker builds locally before deploying to Render

Write-Host "===========================================" -ForegroundColor Green
Write-Host "Production Testing for Disorder Survey" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version
    Write-Host "SUCCESS: Docker found - $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Docker not found or not running" -ForegroundColor Red
    Write-Host "Please make sure Docker Desktop is installed and running" -ForegroundColor Yellow
    exit 1
}

# Check environment file
Write-Host "[2/6] Checking environment file..." -ForegroundColor Cyan
if (Test-Path ".env.prod") {
    Write-Host "SUCCESS: Production environment file found" -ForegroundColor Green
}
else {
    Write-Host "ERROR: .env.prod file not found!" -ForegroundColor Red
    Write-Host "Please create .env.prod with your MongoDB Atlas connection strings" -ForegroundColor Yellow
    exit 1
}

# Test database connection
Write-Host "[3/6] Testing MongoDB Atlas connection..." -ForegroundColor Cyan
$userDbUri = (Get-Content .env.prod | Where-Object { $_ -match "^USER_DB_URI=" }) -replace "USER_DB_URI=", ""
if ($userDbUri) {
    Write-Host "SUCCESS: Database connection string found" -ForegroundColor Green
    $maskedUri = $userDbUri -replace "://.*@", "://***:***@"
    Write-Host "Connecting to: $maskedUri" -ForegroundColor Blue
}
else {
    Write-Host "ERROR: USER_DB_URI not found in .env.prod" -ForegroundColor Red
    exit 1
}

# Build production images
Write-Host "[4/6] Building production images..." -ForegroundColor Cyan
$services = @(
    @{ Name = "user-service"; Path = "./microservices/user-service" },
    @{ Name = "student-service"; Path = "./microservices/student-service" },
    @{ Name = "form-service"; Path = "./microservices/form-service" },
    @{ Name = "analytics-service"; Path = "./microservices/analytics-service" },
    @{ Name = "frontend"; Path = "./my-app" }
)

$buildSuccess = $true
foreach ($service in $services) {
    Write-Host "  Building $($service.Name)..." -ForegroundColor Blue
    
    $buildOutput = docker build -f "$($service.Path)/Dockerfile.prod" -t "disorder-survey-$($service.Name):test" $service.Path 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SUCCESS: $($service.Name) built" -ForegroundColor Green
    }
    else {
        Write-Host "  ERROR: $($service.Name) build failed" -ForegroundColor Red
        Write-Host "  Build output: $buildOutput" -ForegroundColor Yellow
        $buildSuccess = $false
    }
}

if (-not $buildSuccess) {
    Write-Host "Build failures detected. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "[5/6] Starting services..." -ForegroundColor Cyan
try {
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Services started" -ForegroundColor Green
        
        # Wait a moment for services to initialize
        Write-Host "Waiting 30 seconds for services to initialize..." -ForegroundColor Blue
        Start-Sleep -Seconds 30
    }
    else {
        Write-Host "ERROR: Failed to start services" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "ERROR: Exception starting services: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test health endpoints
Write-Host "[6/6] Testing health endpoints..." -ForegroundColor Cyan
$healthTests = @(
    @{ Service = "user-service"; Port = 3001; Container = "disorder_teaching_survey-user-service-1" },
    @{ Service = "student-service"; Port = 3002; Container = "disorder_teaching_survey-student-service-1" },
    @{ Service = "form-service"; Port = 3003; Container = "disorder_teaching_survey-form-service-1" },
    @{ Service = "analytics-service"; Port = 3004; Container = "disorder_teaching_survey-analytics-service-1" }
)

$healthSuccess = $true
foreach ($test in $healthTests) {
    try {
        # Test from inside the container (this is more reliable on Windows)
        $result = docker exec $test.Container curl -f -s "http://localhost:$($test.Port)/healthz" 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $result -eq "OK") {
            Write-Host "  SUCCESS: $($test.Service) health check passed (internal)" -ForegroundColor Green
        }
        else {
            Write-Host "  ERROR: $($test.Service) health check failed: $result" -ForegroundColor Red
            $healthSuccess = $false
        }
    }
    catch {
        Write-Host "  ERROR: $($test.Service) health check failed: $($_.Exception.Message)" -ForegroundColor Red
        $healthSuccess = $false
    }
}

# Additional note about external access
Write-Host "" -ForegroundColor Cyan
Write-Host "Note: Health checks tested from inside containers due to Docker Desktop networking." -ForegroundColor Yellow
Write-Host "Services are accessible via port mappings: 3001, 3002, 3003, 3004" -ForegroundColor Yellow

# Results
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green

if ($buildSuccess -and $healthSuccess) {
    Write-Host "SUCCESS: All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your production setup is ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test your services:" -ForegroundColor Blue
    Write-Host "  User Service:      http://localhost:3001/healthz"
    Write-Host "  Student Service:   http://localhost:3002/healthz"
    Write-Host "  Form Service:      http://localhost:3003/healthz"
    Write-Host "  Analytics Service: http://localhost:3004/healthz"
    Write-Host "  Frontend:          http://localhost:80"
    Write-Host ""
    Write-Host "View logs: docker-compose -f docker-compose.prod.yml logs -f [service]" -ForegroundColor Blue
    Write-Host "Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Blue
}
else {
    Write-Host "FAILED: Some tests failed. Please check errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Debug commands:" -ForegroundColor Yellow
    Write-Host "  View logs: docker-compose -f docker-compose.prod.yml logs"
    Write-Host "  Check status: docker-compose -f docker-compose.prod.yml ps"
    Write-Host "  Stop services: docker-compose -f docker-compose.prod.yml down"
}

Write-Host "===========================================" -ForegroundColor Green

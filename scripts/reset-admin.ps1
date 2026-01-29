# Script to create/reset admin user in Docker container
param(
    [string]$Email = "admin@example.com",
    [string]$Password = "Admin123!",
    [string]$Name = "System Admin"
)

Write-Host "Creating/Resetting Admin User..." -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host "Password: $Password" -ForegroundColor Yellow
Write-Host ""

# Copy the script to the container
Write-Host "Copying script to user-service container..." -ForegroundColor Gray
docker cp scripts/create-admin.js disorder_teaching_survey-user-service-1:/app/create-admin.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to copy script to container" -ForegroundColor Red
    exit 1
}

# Run the script inside the container
Write-Host "Running admin creation script..." -ForegroundColor Gray
docker exec -e ADMIN_EMAIL="$Email" -e ADMIN_PASSWORD="$Password" -e ADMIN_NAME="$Name" -w /app disorder_teaching_survey-user-service-1 node create-admin.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Success! You can now login at http://localhost:5173" -ForegroundColor Green
    Write-Host "   Email: $Email" -ForegroundColor Cyan
    Write-Host "   Password: $Password" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to create admin user" -ForegroundColor Red
    exit 1
}

# Clean up
docker exec disorder_teaching_survey-user-service-1 rm /app/create-admin.js

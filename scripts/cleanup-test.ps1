# Cleanup script for production testing
# Stops and removes all test containers, networks, and volumes

Write-Host "🧹 Cleaning up production test environment..." -ForegroundColor Yellow
Write-Host ""

try {
    # Stop and remove containers
    Write-Host "Stopping containers..." -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml down --remove-orphans --volumes

    # Remove test images (optional)
    Write-Host "Removing test images..." -ForegroundColor Cyan
    $testImages = docker images --filter "reference=disorder-survey-*:test" -q
    if ($testImages) {
        docker rmi $testImages --force
        Write-Host "✅ Test images removed" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️ No test images to remove" -ForegroundColor Blue
    }

    # Clean up any dangling resources
    Write-Host "Cleaning up dangling resources..." -ForegroundColor Cyan
    docker system prune -f

    Write-Host ""
    Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Some cleanup operations failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This is often normal and doesn't indicate a problem." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ready for fresh testing or deployment! 🚀" -ForegroundColor Green

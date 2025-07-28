# PowerShell script to generate a secure JWT secret
# Run this script and copy the output to your .env files

Write-Host "===================================" -ForegroundColor Green
Write-Host "JWT Secret Generator" -ForegroundColor Green  
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Generated JWT Secret (copy this to your .env files):" -ForegroundColor Yellow
Write-Host ""

# Generate a secure random string using .NET crypto
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$JWT_SECRET = [System.Convert]::ToBase64String($bytes)
$rng.Dispose()

Write-Host "JWT_SECRET=$JWT_SECRET" -ForegroundColor Cyan

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "Save this secret securely!" -ForegroundColor Yellow
Write-Host "WARNING: Never commit this to git!" -ForegroundColor Red
Write-Host "===================================" -ForegroundColor Green

# Production Testing Guide

This directory contains scripts to test your production Docker setup locally before deploying to Render.

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **MongoDB Atlas** cluster set up
3. **Environment file** `.env.prod` configured with your Atlas connection strings

## 🚀 Usage

### Run Full Production Test
```powershell
.\scripts\test-production-local.ps1
```

### Test Options
```powershell
# Skip rebuilding images (faster for subsequent runs)
.\scripts\test-production-local.ps1 -SkipBuild

# Verbose output
.\scripts\test-production-local.ps1 -Verbose

# Clean up previous test
.\scripts\test-production-local.ps1 -Clean
```

### Clean Up After Testing
```powershell
.\scripts\cleanup-test.ps1
```

## 📊 What the test does

1. **Checks prerequisites** (Docker, environment files)
2. **Tests database connectivity** to MongoDB Atlas
3. **Builds production Docker images** for all services
4. **Starts services** using production configuration
5. **Tests health endpoints** (/healthz) for each service
6. **Shows service status** and access URLs

## 🔍 Test Results

### ✅ Success Indicators
- All services build successfully
- Database connection works
- All health checks pass
- Services are accessible on their ports

### ❌ Common Issues
- **Database connection fails**: Check MongoDB Atlas network access and connection string
- **Build failures**: Check Dockerfile.prod syntax and dependencies
- **Health checks fail**: Check service startup logs
- **Port conflicts**: Make sure ports 3001-3004 and 80 are available

## 🌐 Test URLs

After successful test, access your services at:
- User Service: http://localhost:3001/healthz
- Student Service: http://localhost:3002/healthz  
- Form Service: http://localhost:3003/healthz
- Analytics Service: http://localhost:3004/healthz
- Frontend: http://localhost:80

## 🛠️ Troubleshooting

### View service logs
```powershell
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

### Check service status
```powershell
docker-compose -f docker-compose.prod.yml ps
```

### Restart a specific service
```powershell
docker-compose -f docker-compose.prod.yml restart [service-name]
```

## 🧹 Cleanup

Always clean up after testing:
```powershell
# Quick cleanup
docker-compose -f docker-compose.prod.yml down

# Full cleanup (removes images too)
.\scripts\cleanup-test.ps1
```

## 📝 Notes

- These scripts are safe to commit to git (no secrets)
- Tests use the same production configuration that will be deployed to Render
- Database tests use your real MongoDB Atlas cluster
- Images are tagged with `:test` suffix to avoid conflicts

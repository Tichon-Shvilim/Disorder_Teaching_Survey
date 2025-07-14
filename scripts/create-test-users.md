# Test User Creation Script

## Create sample users for testing the UserList functionality

### 1. Create an Admin User
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Wilson",
    "email": "admin@school.com",
    "password": "password123",
    "role": "admin"
  }'
```

### 2. Create a Teacher with Classes
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ms. Emily Johnson",
    "email": "teacher@school.com",
    "password": "password123",
    "role": "teacher",
    "classes": [
      {
        "_id": "60f1b2b5d4f8c12345678901",
        "classNumber": "5A"
      },
      {
        "_id": "60f1b2b5d4f8c12345678902", 
        "classNumber": "6B"
      }
    ]
  }'
```

### 3. Create a Therapist with Students
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jennifer Davis",
    "email": "therapist@school.com",
    "password": "password123",
    "role": "therapist",
    "students": [
      {
        "_id": "60f1b2b5d4f8c12345678904",
        "name": "Emma Johnson"
      },
      {
        "_id": "60f1b2b5d4f8c12345678905",
        "name": "Michael Chen"
      }
    ]
  }'
```

### 4. Create an Inactive User
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mr. Inactive User",
    "email": "inactive@school.com", 
    "password": "password123",
    "role": "teacher",
    "status": "inactive"
  }'
```

### 5. Test API Response
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Content-Type: application/json"
```

After running these commands, you should be able to see users in your UserList component with proper assignments displayed.

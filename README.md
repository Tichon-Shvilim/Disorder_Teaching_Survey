# Disorder Teaching Survey

A comprehensive microservices-based platform for special needs education management, featuring secure user management, student tracking, and form-based assessments.

## 🏗️ Architecture

### Microservices
- **User Service** (Port 4001): Authentication, user management, and role-based access control
- **Student Service** (Port 4002): Student and class management
- **Form Service** (Port 4003): Questionnaire templates and form management  
- **Analytics Service** (Port 4004): Data analysis and reporting for form submissions
- **Frontend** (Port 5173): React-based user interface

### Database
- MongoDB with separate databases per service
- Shared authentication across all services

## 🔐 Security Features

### Authentication & Authorization
- **JWT Token System**: Access tokens (1 hour) + Refresh tokens (7 days)
- **Automatic Token Refresh**: Frontend automatically refreshes tokens before expiry
- **Role-Based Access Control**: Admin, Teacher, and Therapist roles with specific permissions
- **Resource-Based Authorization**: Users only access data they're assigned to

### User Roles & Permissions

#### **Admin**
- ✅ Full user management (create, update, delete users)
- ✅ Complete access to all students and classes
- ✅ Create and manage questionnaire templates
- ✅ View all analytics and reports

#### **Teacher**
- ❌ Cannot manage other users
- ✅ View students only from assigned classes
- ✅ View classes they're assigned to
- ✅ Access questionnaire templates for assessments
- ❌ Cannot create/edit/delete students or classes

#### **Therapist**
- ❌ Cannot manage other users  
- ✅ View only assigned students
- ✅ View classes containing their assigned students
- ✅ Access questionnaire templates for assessments
- ❌ Cannot create/edit/delete students or classes

### User Assignments Feature
- **Teachers**: Can be assigned to multiple classes with dropdown navigation
- **Therapists**: Can be assigned to specific students with dropdown navigation
- **Assignment Management**: Admin-only class and student assignment functionality

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Development Setup
```bash
# Clone the repository
git clone [repository-url]

# Start all services
docker-compose -f docker-compose.dev.yml up -d --build

# Access the application
# Frontend: http://localhost:5173
# User Service: http://localhost:4001
# Student Service: http://localhost:4002  
# Form Service: http://localhost:4003
# Analytics Service: http://localhost:4004
```

### API Endpoints

#### Authentication (`/api/users/`)
```
POST /login          # User login
POST /refresh-token  # Refresh JWT token
POST /register       # Create new user (Admin only)
GET /                # Get all users (Admin only)
PUT /:id             # Update user profile
```

#### Student Management (`/api/students/`)
```
GET /                # Get students (filtered by role)
POST /               # Create student (Admin only)
PUT /:id             # Update student (Admin only)  
DELETE /:id          # Delete student (Admin only)
```

#### Class Management (`/api/classes/`)
```
GET /                # Get classes (filtered by role)
POST /               # Create class (Admin only)
PUT /:id             # Update class (Admin only)
DELETE /:id          # Delete class (Admin only)
```

#### Form Management (`/api/questionnaires/`)
```
GET /                # Get questionnaire templates
POST /               # Create template (Admin only)
PUT /:id             # Update template (Admin only)
DELETE /:id          # Delete template (Admin only)
```

#### User Assignments (`/api/users/`)
```
POST /:id/classes            # Assign class to teacher (Admin only)
DELETE /:id/classes/:classId # Remove class assignment (Admin only)
POST /:id/students           # Assign student to therapist (Admin only)  
DELETE /:id/students/:studentId # Remove student assignment (Admin only)
```

## 🧪 Testing

### Manual Security Testing Checklist

#### Authentication Flow
1. Sign in with different user roles (Admin, Teacher, Therapist)
2. Verify tokens are stored in localStorage
3. Test automatic token refresh functionality
4. Verify logout clears all tokens

#### Role-Based Access Testing
1. **Admin Testing**: Verify full access to all features
2. **Teacher Testing**: Verify access limited to assigned classes
3. **Therapist Testing**: Verify access limited to assigned students
4. **Unauthorized Access**: Verify 403 errors for restricted actions

#### Data Filtering Verification
1. Create test users with specific assignments
2. Verify teachers only see students from assigned classes
3. Verify therapists only see assigned students  
4. Verify unauthorized access returns proper error responses

## 🔧 Development

### Environment Variables
All services use the following environment variables (configured in `docker-compose.dev.yml`):
- `MONGODB_URI`: Database connection string
- `PORT`: Service port number
- `JWT_SECRET`: Shared secret for token validation
- `USER_SERVICE_URL`: URL for inter-service communication (where applicable)

### Frontend Environment Variables
- `VITE_USER_SERVICE_URL`: User service endpoint
- `VITE_STUDENT_SERVICE_URL`: Student service endpoint  
- `VITE_FORM_SERVICE_URL`: Form service endpoint
- `VITE_ANALYTICS_SERVICE_URL`: Analytics service endpoint

## 📊 Future Development

### Planned Features
- **Assessment System**: Complete form submission and evaluation workflow
- **Advanced Analytics**: Visual dashboards and progress tracking
- **Reporting System**: Automated report generation for administrators
- **Testing Infrastructure**: Comprehensive unit and integration tests

### Architecture Considerations
- All services ready for horizontal scaling
- Database per service pattern for microservices independence
- Centralized authentication for consistent security
- Event-driven architecture ready for future implementations
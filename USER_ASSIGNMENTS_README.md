# User Assignments Feature

## Overview
This feature adds the ability to assign classes to teachers and students to therapists, with a user-friendly dropdown interface to navigate to these assignments.

## Frontend Changes

### UserModel.ts
- Added `ClassReference` interface for class assignments
- Added `StudentReference` interface for student assignments  
- Updated `UserModel` to include optional `classes[]` and `students[]` arrays
- Added `status` field for active/inactive users

### UserList.tsx
- Added new "Assignments" column to the user table
- Added dropdown button showing count of assignments (classes for teachers, students for therapists)
- Added Material-UI Menu component with navigation to specific classes/students
- Enhanced table styling with modern Material-UI components
- Added search functionality
- Changed delete behavior to set status to inactive instead of removing users

## Backend Changes

### User.js (Model)
- Added `status` field with enum ['active', 'inactive'], default 'active'
- Added `classes` array for teacher assignments with `_id` and `classNumber`
- Added `students` array for therapist assignments with `_id` and `name`

### userRoutes.js
- Updated GET routes to populate class and student references
- Enhanced PUT route to handle status and assignment updates
- Added POST `/users/:id/classes` to assign classes to teachers
- Added DELETE `/users/:id/classes/:classId` to remove class assignments
- Added POST `/users/:id/students` to assign students to therapists  
- Added DELETE `/users/:id/students/:studentId` to remove student assignments

## Usage

### For Teachers:
1. Assign classes via POST request to `/api/users/:teacherId/classes`
2. Body should include: `{ "classId": "objectId", "classNumber": "Class1A" }`
3. Teachers will see a dropdown showing "X Classes" in the user table
4. Clicking on a class in the dropdown navigates to that class details

### For Therapists:
1. Assign students via POST request to `/api/users/:therapistId/students`
2. Body should include: `{ "studentId": "objectId", "studentName": "John Doe" }`
3. Therapists will see a dropdown showing "X Students" in the user table
4. Clicking on a student in the dropdown navigates to that student details

### Navigation:
- Classes navigate to: `/admin/class-management/classes/:classId`
- Students navigate to: `/admin/student-management/students/:studentId`

## API Endpoints

### User Assignment Management
```
GET /api/users/                     # Get all users with populated assignments
GET /api/users/:id                  # Get user by ID with populated assignments
PUT /api/users/:id                  # Update user (including status and assignments)
POST /api/users/:id/classes         # Assign class to teacher
DELETE /api/users/:id/classes/:classId # Remove class from teacher  
POST /api/users/:id/students        # Assign student to therapist
DELETE /api/users/:id/students/:studentId # Remove student from therapist
```

## Example Data Structure

### Teacher with Classes:
```json
{
  "id": "123",
  "name": "Jane Smith",
  "email": "jane@school.com",
  "role": "teacher",
  "status": "active",
  "classes": [
    {
      "_id": "class123",
      "classNumber": "5A"
    },
    {
      "_id": "class456", 
      "classNumber": "6B"
    }
  ]
}
```

### Therapist with Students:
```json
{
  "id": "456",
  "name": "Dr. John Wilson", 
  "email": "john@therapy.com",
  "role": "therapist",
  "status": "active",
  "students": [
    {
      "_id": "student123",
      "name": "Emma Johnson"
    },
    {
      "_id": "student456",
      "name": "Michael Chen"
    }
  ]
}
```

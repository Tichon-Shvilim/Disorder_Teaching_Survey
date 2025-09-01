const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const axios = require('axios'); // For fetching user assignments
const { authenticateJWT, authorizeRole, authorizeDataAccess } = require('../middleware/auth');
const router = express.Router();

// GET all students - with role-based filtering
router.get('/', authenticateJWT, authorizeDataAccess('students'), async (req, res) => {
  try {
    let query = {};
    const userRole = req.userRole;
    const userId = req.userId;

    // Apply role-based filtering
    if (userRole === 'teacher') {
      // Teachers can only see students from their assigned classes
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const classIds = user.classes.map(c => c._id);
        query.classId = { $in: classIds };
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    } else if (userRole === 'therapist') {
      // Therapists can only see their assigned students
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const studentIds = user.students.map(s => s._id);
        query._id = { $in: studentIds };
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    }
    // Admin sees all students (no query filter)

    const students = await Student.find(query).populate('classId', 'classNumber');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a specific student by ID - with role-based access control
router.get('/:id', authenticateJWT, authorizeDataAccess('students'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const userRole = req.userRole;
    const userId = req.userId;

    // Check if user has access to this specific student
    if (userRole === 'teacher') {
      // Check if student is in teacher's assigned classes
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const classIds = user.classes.map(c => c._id);
        
        if (!classIds.includes(student.classId?.toString())) {
          return res.status(403).json({ message: 'Access denied. Student not in your assigned classes.' });
        }
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    } else if (userRole === 'therapist') {
      // Check if student is assigned to therapist
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const studentIds = user.students.map(s => s._id);
        
        if (!studentIds.includes(student._id.toString())) {
          return res.status(403).json({ message: 'Access denied. Student not assigned to you.' });
        }
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    }
    // Admin can access any student

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new student - Admin only
router.post('/', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.DOB) {
      return res.status(400).json({ message: 'Name and date of birth are required' });
    }
    
    if (!req.body.classId) {
      return res.status(400).json({ message: 'Class assignment is required for new students' });
    }
    
    // Verify the class exists
    const classExists = await Class.findById(req.body.classId);
    if (!classExists) {
      return res.status(400).json({ message: 'Invalid class ID provided' });
    }
    
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    
    // Add student to the class's students array
    if (!classExists.students.includes(savedStudent._id)) {
      classExists.students.push(savedStudent._id);
      await classExists.save();
    }
    
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a student - Admin only
router.put('/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    // Validate required fields
    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({ message: 'Student name cannot be empty' });
    }
    
    if (req.body.classId !== undefined && !req.body.classId) {
      return res.status(400).json({ message: 'Class assignment is required' });
    }
    
    // If classId is being updated, verify the class exists
    if (req.body.classId) {
      const classExists = await Class.findById(req.body.classId);
      if (!classExists) {
        return res.status(400).json({ message: 'Invalid class ID provided' });
      }
    }
    
    const originalStudent = await Student.findById(req.params.id);
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Handle class assignment changes
    if (originalStudent) {
      // Remove from old class if class ID changed
      if (originalStudent.classId && !originalStudent.classId.equals(updatedStudent.classId)) {
        const oldClass = await Class.findById(originalStudent.classId);
        if (oldClass) {
          oldClass.students = oldClass.students.filter(studentId => !studentId.equals(updatedStudent._id));
          await oldClass.save();
        }
      }

      // Add to new class if assigned
      if (updatedStudent.classId && !originalStudent.classId?.equals(updatedStudent.classId)) {
        const newClass = await Class.findById(updatedStudent.classId);
        if (newClass && !newClass.students.includes(updatedStudent._id)) {
          newClass.students.push(updatedStudent._id);
          await newClass.save();
        }
      }
    }
    
    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a student - Admin only
router.delete('/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const studentToDelete = await Student.findById(req.params.id);
    
    if (!studentToDelete) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Remove student from class if they were assigned to one
    if (studentToDelete.classId) {
      const classToUpdate = await Class.findById(studentToDelete.classId);
      if (classToUpdate) {
        classToUpdate.students = classToUpdate.students.filter(studentId => !studentId.equals(studentToDelete._id));
        await classToUpdate.save();
      }
    }
    
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ASSIGN a therapist to a student - Admin only
router.put('/:studentId/assign-therapist', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    console.log('=== ASSIGN THERAPIST ENDPOINT CALLED ===');
    console.log('Student ID:', req.params.studentId);
    console.log('Request body:', req.body);
    console.log('User making request:', req.user);
    
    const { studentId } = req.params;
    const { therapistId, therapistName } = req.body;

    if (!therapistId || !therapistName) {
      console.log('Missing required fields:', { therapistId, therapistName });
      return res.status(400).json({ message: 'therapistId and therapistName are required' });
    }

    // 1. Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Check if therapist is already assigned
    const isAlreadyAssigned = student.therapists.some(therapist => 
      therapist._id.toString() === therapistId
    );

    if (isAlreadyAssigned) {
      return res.status(200).json({ message: 'Therapist already assigned to this student' });
    }

    // 3. Add therapist to student's therapists array
    student.therapists.push({ _id: therapistId, name: therapistName });
    await student.save();

    // 4. Update therapist's students array in user-service
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
      const requestData = {
        studentId: studentId,
        studentName: student.name
      };
      
      console.log('=== CALLING USER SERVICE ===');
      console.log('URL:', `${userServiceUrl}/api/users/${therapistId}/add-student`);
      console.log('Request data:', JSON.stringify(requestData));
      
      // Instead of axios, let's try using fetch with explicit headers
      const response = await fetch(`${userServiceUrl}/api/users/${therapistId}/add-student`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('User service response:', result);
    } catch (userServiceError) {
      // Rollback student update if user-service update fails
      student.therapists = student.therapists.filter(therapist => 
        therapist._id.toString() !== therapistId
      );
      await student.save();
      
      console.error('Failed to update user-service:', userServiceError.message);
      return res.status(500).json({ 
        message: 'Failed to update therapist record', 
        error: userServiceError.message 
      });
    }

    res.status(200).json({ 
      message: 'Therapist assigned successfully', 
      student: student 
    });

  } catch (error) {
    console.error('Error assigning therapist:', error);
    res.status(500).json({ message: error.message });
  }
});

// REMOVE a therapist from a student - Admin only
router.delete('/:studentId/remove-therapist', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { therapistId } = req.body;

    if (!therapistId) {
      return res.status(400).json({ message: 'therapistId is required' });
    }

    // 1. Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Check if therapist is assigned
    const therapistIndex = student.therapists.findIndex(therapist => 
      therapist._id.toString() === therapistId
    );

    if (therapistIndex === -1) {
      return res.status(404).json({ message: 'Therapist not assigned to this student' });
    }

    // 3. Remove therapist from student's therapists array
    const removedTherapist = student.therapists[therapistIndex];
    student.therapists.splice(therapistIndex, 1);
    await student.save();

    // 4. Update therapist's students array in user-service
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
      await axios.delete(`${userServiceUrl}/api/users/${therapistId}/remove-student`, {
        data: { studentId: studentId },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
    } catch (userServiceError) {
      // Rollback student update if user-service update fails
      student.therapists.push(removedTherapist);
      await student.save();
      
      console.error('Failed to update user-service:', userServiceError.message);
      return res.status(500).json({ 
        message: 'Failed to update therapist record', 
        error: userServiceError.message 
      });
    }

    res.status(200).json({ 
      message: 'Therapist removed successfully', 
      student: student 
    });

  } catch (error) {
    console.error('Error removing therapist:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



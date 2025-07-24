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
    const student = await Student.findById(req.params.id).populate('classId', 'classNumber');
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
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    
    // If student is assigned to a class, add them to the class's students array
    if (savedStudent.classId) {
      const classToUpdate = await Class.findById(savedStudent.classId);
      if (classToUpdate && !classToUpdate.students.includes(savedStudent._id)) {
        classToUpdate.students.push(savedStudent._id);
        await classToUpdate.save();
      }
    }
    
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a student - Admin only
router.put('/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
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

module.exports = router;



const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const axios = require('axios'); // For fetching user assignments
const { authenticateJWT, authorizeRole, authorizeDataAccess } = require('../middleware/auth');

// GET all classes - with role-based filtering
router.get('/', authenticateJWT, authorizeDataAccess('classes'), async (req, res) => {
  try {
    let query = {};
    const userRole = req.userRole;
    const userId = req.userId;

    // Apply role-based filtering
    if (userRole === 'teacher') {
      // Teachers can only see their assigned classes
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const classIds = user.classes.map(c => c._id);
        query._id = { $in: classIds };
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    } else if (userRole === 'therapist') {
      // Therapists can see classes that contain their assigned students
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const studentIds = user.students.map(s => s._id);
        query.students = { $in: studentIds };
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    }
    // Admin sees all classes (no query filter)

    const classes = await Class.find(query).populate('students', 'name DOB classNumber');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a specific class by ID - with role-based access control
router.get('/:id', authenticateJWT, authorizeDataAccess('classes'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('students', 'name DOB classNumber');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const userRole = req.userRole;
    const userId = req.userId;

    // Check if user has access to this specific class
    if (userRole === 'teacher') {
      // Check if class is assigned to teacher
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const classIds = user.classes.map(c => c._id);
        
        if (!classIds.includes(req.params.id)) {
          return res.status(403).json({ message: 'Access denied. Class not assigned to you.' });
        }
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    } else if (userRole === 'therapist') {
      // Check if class contains therapist's assigned students
      try {
        const userResponse = await axios.get(`${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        const user = userResponse.data;
        const studentIds = user.students.map(s => s._id);
        const classStudentIds = classData.students.map(s => s._id.toString());
        
        const hasAssignedStudents = studentIds.some(id => classStudentIds.includes(id));
        if (!hasAssignedStudents) {
          return res.status(403).json({ message: 'Access denied. Class does not contain your assigned students.' });
        }
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        return res.status(500).json({ message: 'Error fetching user data' });
      }
    }
    // Admin can access any class
    
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new class - Admin only
router.post('/', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const newClass = new Class(req.body);
    const savedClass = await newClass.save();
    
    const populatedClass = await Class.findById(savedClass._id)
      .populate('students', 'name DOB classNumber');
    
    res.status(201).json(populatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a class - Admin only
router.put('/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('students', 'name DOB classNumber');
    
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a class - Admin only
router.delete('/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/auth');
const { authorizeRoles, authorizeResourceAccess } = require('../middleware/authorization');

// Register a new user (public)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();
    res.status(201).send({ message: 'User registered', user });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login route (public)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // 3. Create JWT payload
    const payload = {
      id: user.id,      // virtual id field
      role: user.role,
    };

    // 4. Sign JWT with both access and refresh tokens
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // 5. Return tokens and user info (never return password)
    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Token refresh route (public)
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new access token
    const payload = {
      id: user.id,
      role: user.role,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unified student-therapist assignment helper function
const handleStudentTherapistAssignment = async (therapistId, studentId, studentName, action) => {
  const therapist = await User.findById(therapistId);
  
  if (!therapist) {
    throw new Error('Therapist not found');
  }
  
  if (therapist.role.toLowerCase() !== 'therapist') {
    throw new Error('User is not a therapist');
  }
  
  if (action === 'add') {
    // Check if student is already assigned
    const existingStudent = therapist.students.find(s => s._id.toString() === studentId);
    if (existingStudent) {
      return { message: 'Student already assigned to this therapist', therapist };
    }
    
    therapist.students.push({ _id: studentId, name: studentName });
    await therapist.save();
    
    return { message: 'Student added to therapist successfully', therapist };
  } else if (action === 'remove') {
    // Check if student is assigned
    const studentIndex = therapist.students.findIndex(s => s._id.toString() === studentId);
    if (studentIndex === -1) {
      throw new Error('Student not assigned to this therapist');
    }
    
    therapist.students.splice(studentIndex, 1);
    await therapist.save();
    
    return { message: 'Student removed from therapist successfully', therapist };
  }
};

// Service-to-service routes (no authentication required)
// Add student to therapist (called by student-service)
router.put('/:therapistId/add-student', async (req, res) => {
  try {
    const { studentId, studentName } = req.body;

    if (!studentId || !studentName) {
      return res.status(400).json({ message: 'studentId and studentName are required' });
    }

    const result = await handleStudentTherapistAssignment(req.params.therapistId, studentId, studentName, 'add');
    res.status(200).json(result);
  } catch (error) {
    console.error('Error adding student to therapist:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Remove student from therapist (called by student-service)
router.delete('/:therapistId/remove-student', async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const result = await handleStudentTherapistAssignment(req.params.therapistId, studentId, null, 'remove');
    res.status(200).json(result);
  } catch (error) {
    console.error('Error removing student from therapist:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// All routes below this line require authentication
router.use(authenticateJWT);

// Get all users (protected - Admin only)
router.get('/', authorizeRoles(['Admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Never return passwords
    res.send(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get a user by ID (protected - own profile or admin)
router.get('/:id', authorizeResourceAccess('user-profile'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(400).send({ message: 'Failed to fetch user', error: error.message });
  }
});

// Update a user by ID (protected - Admin only for role changes, users can update own basic info)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, role, status, classes, students } = req.body;
    const requestingUser = req.user;
    const targetUserId = req.params.id;

    // Check permissions
    const isAdmin = requestingUser.role.toLowerCase() === 'admin';
    const isOwnProfile = requestingUser.id === targetUserId;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    // Prepare update data
    const updateData = {};
    
    // Basic info (users can update their own)
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    // Admin-only fields
    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;
      if (classes !== undefined) updateData.classes = classes;
      if (students !== undefined) updateData.students = students;
    } else {
      // Non-admins trying to change protected fields
      if (role !== undefined || status !== undefined || classes !== undefined || students !== undefined) {
        return res.status(403).json({ message: 'Access denied. You cannot modify role, status, or assignments.' });
      }
    }

    const user = await User.findByIdAndUpdate(targetUserId, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).send({ message: 'Failed to update user', error: error.message });
  }
});

// Add class assignment to teacher (protected - Admin only)
router.post('/:id/classes', authorizeResourceAccess('class-assignment'), async (req, res) => {
  try {
    const { classId, classNumber } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.role.toLowerCase() !== 'teacher') return res.status(400).send({ message: 'User is not a teacher' });
    
    // Check if class is already assigned
    const existingClass = user.classes.find(c => c._id.toString() === classId);
    if (existingClass) {
      return res.status(400).send({ message: 'Class already assigned to this teacher' });
    }
    
    user.classes.push({ _id: classId, classNumber });
    await user.save();
    
    const updatedUser = await User.findById(req.params.id).select('-password');
    
    res.send(updatedUser);
  } catch (error) {
    console.error('Error adding class assignment:', error);
    res.status(400).send({ message: 'Failed to add class assignment', error: error.message });
  }
});

// Remove class assignment from teacher (protected - Admin only)
router.delete('/:id/classes/:classId', authorizeResourceAccess('class-assignment'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.role.toLowerCase() !== 'teacher') return res.status(400).send({ message: 'User is not a teacher' });
    
    user.classes = user.classes.filter(c => c._id.toString() !== req.params.classId);
    await user.save();
    
    const updatedUser = await User.findById(req.params.id).select('-password');
    
    res.send(updatedUser);
  } catch (error) {
    console.error('Error removing class assignment:', error);
    res.status(400).send({ message: 'Failed to remove class assignment', error: error.message });
  }
});

// Add student assignment to therapist (protected - Admin only)
router.post('/:id/students', authorizeResourceAccess('student-assignment'), async (req, res) => {
  try {
    const { studentId, studentName } = req.body;
    
    if (!studentId || !studentName) {
      return res.status(400).json({ message: 'studentId and studentName are required' });
    }
    
    const result = await handleStudentTherapistAssignment(req.params.id, studentId, studentName, 'add');
    const updatedUser = await User.findById(req.params.id).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error adding student assignment:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('already assigned') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Remove student assignment from therapist (protected - Admin only)
router.delete('/:id/students/:studentId', authorizeResourceAccess('student-assignment'), async (req, res) => {
  try {
    const result = await handleStudentTherapistAssignment(req.params.id, req.params.studentId, null, 'remove');
    const updatedUser = await User.findById(req.params.id).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error removing student assignment:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

// Delete a user by ID (protected - Admin only)
router.delete('/:id', authorizeRoles(['Admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send({ message: 'User deleted', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;

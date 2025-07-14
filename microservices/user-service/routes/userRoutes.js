const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/auth');

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

    // 4. Sign JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 5. Return token and user info (never return password)
    res.json({
      token,
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

// All routes below this line require authentication
router.use(authenticateJWT);

// Get all users (protected)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get a user by ID (protected)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(400).send({ message: 'Failed to fetch user', error: error.message });
  }
});

// Update a user by ID (protected)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, role, status, classes, students } = req.body;
    const updateData = { name, email, role, status, classes, students };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).send({ message: 'Failed to update user', error: error.message });
  }
});

// Add class assignment to teacher (protected)
router.post('/:id/classes', async (req, res) => {
  try {
    const { classId, classNumber } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.role !== 'teacher') return res.status(400).send({ message: 'User is not a teacher' });
    
    // Check if class is already assigned
    const existingClass = user.classes.find(c => c._id.toString() === classId);
    if (existingClass) {
      return res.status(400).send({ message: 'Class already assigned to this teacher' });
    }
    
    user.classes.push({ _id: classId, classNumber });
    await user.save();
    
    const updatedUser = await User.findById(req.params.id);
    
    res.send(updatedUser);
  } catch (error) {
    console.error('Error adding class assignment:', error);
    res.status(400).send({ message: 'Failed to add class assignment', error: error.message });
  }
});

// Remove class assignment from teacher (protected)
router.delete('/:id/classes/:classId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.role !== 'teacher') return res.status(400).send({ message: 'User is not a teacher' });
    
    user.classes = user.classes.filter(c => c._id.toString() !== req.params.classId);
    await user.save();
    
    const updatedUser = await User.findById(req.params.id);
    
    res.send(updatedUser);
  } catch (error) {
    console.error('Error removing class assignment:', error);
    res.status(400).send({ message: 'Failed to remove class assignment', error: error.message });
  }
});

// Add student assignment to therapist (protected)
router.post('/:id/students', async (req, res) => {
  try {
    const { studentId, studentName } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.role !== 'therapist') return res.status(400).send({ message: 'User is not a therapist' });
    
    // Check if student is already assigned
    const existingStudent = user.students.find(s => s._id.toString() === studentId);
    if (existingStudent) {
      return res.status(400).send({ message: 'Student already assigned to this therapist' });
    }
    
    user.students.push({ _id: studentId, name: studentName });
    await user.save();
    
    const updatedUser = await User.findById(req.params.id);
    
    res.send(updatedUser);
  } catch (error) {
    console.error('Error adding student assignment:', error);
    res.status(400).send({ message: 'Failed to add student assignment', error: error.message });
  }
});

// Remove student assignment from therapist (protected)
router.delete('/:id/students/:studentId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.role !== 'therapist') return res.status(400).send({ message: 'User is not a therapist' });
    
    user.students = user.students.filter(s => s._id.toString() !== req.params.studentId);
    await user.save();
    
    const updatedUser = await User.findById(req.params.id);
    
    res.send(updatedUser);
  } catch (error) {
    console.error('Error removing student assignment:', error);
    res.status(400).send({ message: 'Failed to remove student assignment', error: error.message });
  }
});

// Delete a user by ID (protected)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send({ message: 'User deleted', user });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;

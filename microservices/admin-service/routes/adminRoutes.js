const express = require('express');
const Admin = require('../models/Admin');
const router = express.Router();

// Register a new admin
router.post('/register', async (req, res) => {
  const admin = new Admin(req.body);
  await admin.save();
  res.status(201).send(admin);
});

// Get all users
router.get('/users', async (req, res) => {
  // Assuming there's a User model
  const users = await User.find();
  res.send(users);
});

// Get all students
router.get('/students', async (req, res) => {
  // Assuming there's a Student model
  const students = await Student.find();
  res.send(students);
});

module.exports = router;

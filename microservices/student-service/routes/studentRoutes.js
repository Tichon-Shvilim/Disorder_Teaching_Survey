const express = require('express');
const Student = require('../models/Student');
const router = express.Router();

// Register a new student
router.post('/', async (req, res) => {
  const student = new Student(req.body);
  await student.save();
  res.status(201).send(student);
});

// Get all students
router.get('/', async (req, res) => {
  const students = await Student.find();
  res.send(students);
});

module.exports = router;



const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

// GET all classes - temporarily disabled authentication for testing
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('students', 'name DOB classNumber');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a specific class by ID - temporarily disabled authentication for testing
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('students', 'name DOB classNumber');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new class - temporarily disabled authentication for testing
router.post('/', async (req, res) => {
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

// UPDATE a class - temporarily disabled authentication for testing
router.put('/:id', async (req, res) => {
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

// DELETE a class - temporarily disabled authentication for testing
router.delete('/:id', async (req, res) => {
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
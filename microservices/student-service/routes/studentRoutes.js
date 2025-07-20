const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// GET all students - temporarily disabled authentication for testing
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().populate('classId', 'classNumber');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a specific student by ID - temporarily disabled authentication for testing
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('classId', 'classNumber');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new student - temporarily disabled authentication for testing
router.post('/', async (req, res) => {
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

// UPDATE a student - temporarily disabled authentication for testing
router.put('/:id', async (req, res) => {
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

// DELETE a student - temporarily disabled authentication for testing
router.delete('/:id', async (req, res) => {
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



const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const axios = require('axios');
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

// ASSIGN a therapist to a student
router.put('/:studentId/assign-therapist', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { therapistId, therapistName } = req.body;

    if (!therapistId || !therapistName) {
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
      await axios.put(`${userServiceUrl}/api/users/${therapistId}/add-student`, {
        studentId: studentId,
        studentName: student.name
      });
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

// REMOVE a therapist from a student
router.delete('/:studentId/remove-therapist', async (req, res) => {
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
        data: { studentId: studentId }
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



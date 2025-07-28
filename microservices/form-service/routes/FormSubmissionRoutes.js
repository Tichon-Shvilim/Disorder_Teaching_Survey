const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const FormSubmission = require('../models/FormSubmission');
const QuestionnaireTemplate = require('../models/QuestionnaireTemplate');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// Helper function to get user assignments from user-service
async function getUserAssignments(userId, authHeader) {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.get(`${userServiceUrl}/api/users/${userId}`, {
      headers: { Authorization: authHeader }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    throw new Error('Failed to fetch user assignments');
  }
}

// Helper function to check if user can access a specific student
async function canAccessStudent(user, studentId, authHeader) {
  if (user.role.toLowerCase() === 'admin') return true;
  
  const userWithAssignments = await getUserAssignments(user.id, authHeader);
  
  if (user.role.toLowerCase() === 'therapist') {
    return userWithAssignments.students?.some(s => s._id === studentId);
  }
  
  if (user.role.toLowerCase() === 'teacher') {
    // For teachers, we need to check if the student is in any of their assigned classes
    try {
      // Get the student's class information from student-service
      const studentServiceUrl = process.env.STUDENT_SERVICE_URL || 'http://student-service:3002';
      const studentResponse = await axios.get(`${studentServiceUrl}/api/students/${studentId}`, {
        headers: { Authorization: authHeader }
      });
      
      const student = studentResponse.data;
      
      // Check if the student's class is in the teacher's assigned classes
      const teacherClassIds = userWithAssignments.classes?.map(c => c._id) || [];
      
      if (student.classId && teacherClassIds.includes(student.classId.toString())) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking teacher access to student:', error);
      // If we can't verify access due to service issues, deny access for security
      return false;
    }
  }
  
  return false;
}

// GET all submissions for a student
router.get('/submissions/student/:studentId', authenticateJWT, async (req, res) => {
  try {
    const { studentId } = req.params;
    const user = req.user; // From auth middleware
    
    // Check if user has access to this student
    const hasAccess = await canAccessStudent(user, studentId, req.headers.authorization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You cannot view submissions for this student.' });
    }
    
    const submissions = await FormSubmission.find({ studentId })
      .sort({ submittedAt: -1 })
      .populate('questionnaireId', 'title description');
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// GET a specific submission by ID
router.get('/submissions/:id', authenticateJWT, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id)
      .populate('questionnaireId');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    const user = req.user; // From auth middleware
    
    // Check if user has access to this submission
    const hasAccess = await canAccessStudent(user, submission.studentId, req.headers.authorization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You cannot view this submission.' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

// POST - Submit a completed form
router.post('/submissions', authenticateJWT, async (req, res) => {
  try {
    const { 
      studentId, 
      studentName, 
      questionnaireId, 
      answers, 
      completedBy, 
      notes 
    } = req.body;

    // Validate required fields
    if (!studentId || !studentName || !questionnaireId || !answers) {
      return res.status(400).json({ 
        message: 'Missing required fields: studentId, studentName, questionnaireId, answers' 
      });
    }

    const user = req.user; // From auth middleware
    
    // Check if user has access to submit forms for this student
    const hasAccess = await canAccessStudent(user, studentId, req.headers.authorization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You cannot submit forms for this student.' });
    }

    // Validate that questionnaireId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(questionnaireId)) {
      console.error('Invalid questionnaireId format:', questionnaireId);
      return res.status(400).json({ 
        message: 'Invalid questionnaire ID format' 
      });
    }

    // Get questionnaire template for validation
    const questionnaire = await QuestionnaireTemplate.findById(questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire template not found' });
    }

    // Create new submission
    const submission = new FormSubmission({
      studentId,
      studentName,
      questionnaireId,
      questionnaireTitle: questionnaire.title,
      answers,
      completedBy: completedBy || user.name || `${user.role} (${user.id})`, // Default to current user
      notes,
      status: 'completed'
    });

    const savedSubmission = await submission.save();
    
    res.status(201).json({
      message: 'Form submitted successfully',
      submission: savedSubmission
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Failed to submit form' });
  }
});

// PUT - Update a submission (for drafts or corrections)
router.put('/submissions/:id', authenticateJWT, async (req, res) => {
  try {
    const { answers, notes, status } = req.body;
    const user = req.user; // From auth middleware
    
    // First, get the existing submission to check ownership
    const existingSubmission = await FormSubmission.findById(req.params.id);
    if (!existingSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check if user has access to this submission
    const hasAccess = await canAccessStudent(user, existingSubmission.studentId, req.headers.authorization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You cannot update this submission.' });
    }
    
    const updatedSubmission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      { 
        answers, 
        notes, 
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: 'Failed to update submission' });
  }
});

// DELETE a submission
router.delete('/submissions/:id', authenticateJWT, async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    
    // First, get the existing submission to check access
    const existingSubmission = await FormSubmission.findById(req.params.id);
    if (!existingSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check if user has access to this submission
    const hasAccess = await canAccessStudent(user, existingSubmission.studentId, req.headers.authorization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You cannot delete this submission.' });
    }
    
    const deletedSubmission = await FormSubmission.findByIdAndDelete(req.params.id);

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Failed to delete submission' });
  }
});

// GET all submissions (for admin/analytics)
router.get('/submissions', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 10, questionnaireId, status } = req.query;
    const user = req.user; // From auth middleware
    
    const filter = {};
    if (questionnaireId) filter.questionnaireId = questionnaireId;
    if (status) filter.status = status;
    
    // Apply role-based filtering
    if (user.role.toLowerCase() !== 'admin') {
      // For non-admin users, filter by their assigned students
      const userWithAssignments = await getUserAssignments(user.id, req.headers.authorization);
      
      let allowedStudentIds = [];
      
      if (user.role.toLowerCase() === 'therapist') {
        allowedStudentIds = userWithAssignments.students?.map(s => s._id) || [];
      } else if (user.role.toLowerCase() === 'teacher') {
        // For teachers, get students from their assigned classes
        try {
          const teacherClassIds = userWithAssignments.classes?.map(c => c._id) || [];
          
          if (teacherClassIds.length > 0) {
            // Get all students from the teacher's assigned classes
            const studentServiceUrl = process.env.STUDENT_SERVICE_URL || 'http://student-service:3002';
            const studentsResponse = await axios.get(`${studentServiceUrl}/api/students`, {
              headers: { Authorization: req.headers.authorization }
            });
            
            // Filter students to only those in the teacher's classes
            const teacherStudents = studentsResponse.data.filter(student => 
              student.classId && teacherClassIds.includes(student.classId.toString())
            );
            
            allowedStudentIds = teacherStudents.map(student => student._id.toString());
          }
        } catch (error) {
          console.error('Error fetching teacher students:', error);
          // If we can't fetch students, return empty array for security
          allowedStudentIds = [];
        }
      }
      
      if (allowedStudentIds.length === 0) {
        // If no students assigned, return empty result
        return res.json({
          submissions: [],
          totalPages: 0,
          currentPage: page,
          total: 0
        });
      }
      
      filter.studentId = { $in: allowedStudentIds };
    }
    // Admin sees all submissions (no additional filter)
    
    const submissions = await FormSubmission.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('questionnaireId', 'title description');
    
    const total = await FormSubmission.countDocuments(filter);
    
    res.json({
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

module.exports = router;

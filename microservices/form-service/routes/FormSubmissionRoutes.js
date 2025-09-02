const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const FormSubmission = require('../models/FormSubmission');
const QuestionnaireTemplate = require('../models/QuestionnaireTemplate');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Helper function to fetch student data from student-service
async function fetchStudentData(studentId, authHeader) {
  try {
    const studentResponse = await axios.get(
      `${process.env.STUDENT_SERVICE_URL || 'http://student-service:3002'}/api/students/${studentId}`,
      { headers: { Authorization: authHeader } }
    );
    return studentResponse.data;
  } catch (error) {
    console.error('Error fetching student data:', error.message);
    return null;
  }
}

// Helper function to validate question IDs against questionnaire template
async function validateQuestionIds(questionnaireId, answers) {
  try {
    const questionnaire = await QuestionnaireTemplate.findById(questionnaireId);
    if (!questionnaire) {
      return { valid: false, error: 'Questionnaire not found' };
    }

    // Extract all question IDs from the questionnaire structure
    const validQuestionIds = new Set();
    
    const extractQuestionIds = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'question') {
          validQuestionIds.add(node.id);
        }
        if (node.children && node.children.length > 0) {
          extractQuestionIds(node.children);
        }
      });
    };
    
    extractQuestionIds(questionnaire.structure);

    // Validate each answer's questionId
    const invalidQuestionIds = answers
      .map(answer => answer.questionId)
      .filter(questionId => !validQuestionIds.has(questionId));

    if (invalidQuestionIds.length > 0) {
      return { 
        valid: false, 
        error: `Invalid question IDs: ${invalidQuestionIds.join(', ')}` 
      };
    }

    return { valid: true, questionnaire };
  } catch (error) {
    console.error('Error validating question IDs:', error);
    return { valid: false, error: 'Validation error' };
  }
}

// Submit form responses - Teachers, Therapists, and Admins can submit
router.post('/submit', authenticateJWT, authorizeRole(['Teacher', 'Therapist', 'Admin']), async (req, res) => {
  try {
    const { 
      studentId, 
      questionnaireId, 
      answers, 
      status = 'completed',
      notes 
    } = req.body;

    // Validate required fields
    if (!studentId || !questionnaireId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'studentId, questionnaireId, and answers array are required'
      });
    }

    // Validate ObjectId format for questionnaireId
    if (!mongoose.Types.ObjectId.isValid(questionnaireId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid questionnaire ID format'
      });
    }

    // Validate status
    if (!['draft', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "draft" or "completed"'
      });
    }

    // Validate question IDs against questionnaire template
    const validation = await validateQuestionIds(questionnaireId, answers);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Fetch student data to get student name
    const studentData = await fetchStudentData(studentId, req.headers.authorization);
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or access denied'
      });
    }

    // Validate each answer structure
    for (const answer of answers) {
      if (!answer.questionId || !answer.inputType || answer.answer === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each answer must have questionId, inputType, and answer fields'
        });
      }

      // Validate inputType
      const validInputTypes = ['single-choice', 'multiple-choice', 'scale', 'number', 'text'];
      if (!validInputTypes.includes(answer.inputType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid inputType: ${answer.inputType}`
        });
      }
    }

    // Create the form submission
    const formSubmission = new FormSubmission({
      studentId,
      studentName: studentData.name,
      questionnaireId: new mongoose.Types.ObjectId(questionnaireId),
      questionnaireTitle: validation.questionnaire.title,
      answers,
      status,
      notes,
      completedBy: req.user.id,
      submittedAt: status === 'completed' ? new Date() : null
    });

    await formSubmission.save();

    res.status(201).json({
      success: true,
      message: `Form ${status} successfully`,
      data: {
        submissionId: formSubmission._id,
        studentName: studentData.name,
        questionnaireTitle: validation.questionnaire.title,
        status,
        submittedAt: formSubmission.submittedAt,
        answersCount: answers.length
      }
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit form',
      error: error.message
    });
  }
});

// Get form submissions with role-based filtering
router.get('/submissions', authenticateJWT, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    let query = {};

    // Apply role-based filtering
    if (userRole === 'Teacher') {
      // Teachers can only see submissions for students in their classes
      // We'll need to fetch user's classes and filter by students in those classes
      try {
        const userResponse = await axios.get(
          `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        
        if (userResponse.data.classes && userResponse.data.classes.length > 0) {
          // Get students from user's classes via student-service
          const classIds = userResponse.data.classes.map(c => c._id);
          const studentsResponse = await axios.get(
            `${process.env.STUDENT_SERVICE_URL || 'http://student-service:3002'}/api/students?classIds=${classIds.join(',')}`,
            { headers: { Authorization: req.headers.authorization } }
          );
          
          const studentIds = studentsResponse.data.map(s => s._id);
          query.studentId = { $in: studentIds };
        } else {
          // Teacher has no classes, return empty results
          return res.json({ success: true, data: [] });
        }
      } catch (error) {
        console.error('Error fetching teacher assignments:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching user assignments' 
        });
      }
    } else if (userRole === 'Therapist') {
      // Therapists can only see submissions for their assigned students
      try {
        const userResponse = await axios.get(
          `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        
        if (userResponse.data.students && userResponse.data.students.length > 0) {
          const studentIds = userResponse.data.students.map(s => s._id);
          query.studentId = { $in: studentIds };
        } else {
          // Therapist has no assigned students, return empty results
          return res.json({ success: true, data: [] });
        }
      } catch (error) {
        console.error('Error fetching therapist assignments:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching user assignments' 
        });
      }
    }
    // Admin sees all submissions (no additional query filters)

    // Add optional filters from query parameters
    if (req.query.questionnaireId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.questionnaireId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid questionnaire ID format'
        });
      }
      query.questionnaireId = new mongoose.Types.ObjectId(req.query.questionnaireId);
    }

    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Fetch submissions
    const submissions = await FormSubmission.find(query)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-answers'); // Exclude answers for list view performance

    const total = await FormSubmission.countDocuments(query);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form submissions',
      error: error.message
    });
  }
});

// Get specific form submission by ID
router.get('/submissions/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const submission = await FormSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }

    // Check authorization - users can only view submissions they have access to
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'Admin') {
      // For non-admins, verify they have access to this student
      let hasAccess = false;

      if (userRole === 'Teacher') {
        // Check if student is in teacher's classes
        try {
          const userResponse = await axios.get(
            `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`,
            { headers: { Authorization: req.headers.authorization } }
          );
          
          if (userResponse.data.classes && userResponse.data.classes.length > 0) {
            const classIds = userResponse.data.classes.map(c => c._id);
            const studentsResponse = await axios.get(
              `${process.env.STUDENT_SERVICE_URL || 'http://student-service:3002'}/api/students?classIds=${classIds.join(',')}`,
              { headers: { Authorization: req.headers.authorization } }
            );
            
            const studentIds = studentsResponse.data.map(s => s._id);
            hasAccess = studentIds.includes(submission.studentId);
          }
        } catch (error) {
          console.error('Error checking teacher access:', error);
        }
      } else if (userRole === 'Therapist') {
        // Check if student is assigned to therapist
        try {
          const userResponse = await axios.get(
            `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`,
            { headers: { Authorization: req.headers.authorization } }
          );
          
          if (userResponse.data.students && userResponse.data.students.length > 0) {
            const studentIds = userResponse.data.students.map(s => s._id);
            hasAccess = studentIds.includes(submission.studentId);
          }
        } catch (error) {
          console.error('Error checking therapist access:', error);
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not have permission to view this submission'
        });
      }
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form submission',
      error: error.message
    });
  }
});

// Update form submission (convert draft to completed, add notes, etc.)
router.put('/submissions/:id', authenticateJWT, authorizeRole(['Teacher', 'Therapist', 'Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const submission = await FormSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }

    // Check if user has permission to update this submission
    if (req.user.role !== 'Admin' && submission.completedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only update submissions you created'
      });
    }

    // Validate status if provided
    if (status && !['draft', 'completed', 'reviewed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "draft", "completed", or "reviewed"'
      });
    }

    // Update fields
    const updateData = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'completed' && !submission.submittedAt) {
        updateData.submittedAt = new Date();
      }
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (answers && Array.isArray(answers)) {
      // Validate question IDs if answers are being updated
      const validation = await validateQuestionIds(submission.questionnaireId, answers);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
      updateData.answers = answers;
    }

    const updatedSubmission = await FormSubmission.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Form submission updated successfully',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update form submission',
      error: error.message
    });
  }
});

// Delete form submission - Admin only
router.delete('/submissions/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const submission = await FormSubmission.findByIdAndDelete(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Form submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete form submission',
      error: error.message
    });
  }
});

module.exports = router;

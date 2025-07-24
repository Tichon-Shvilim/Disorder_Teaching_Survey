const express = require('express');
const FormSubmission = require('../models/FormSubmission');
const QuestionnaireTemplate = require('../models/QuestionnaireTemplate');
const router = express.Router();

// GET all submissions for a student
router.get('/submissions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
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
router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id)
      .populate('questionnaireId');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

// POST - Submit a completed form
router.post('/submissions', async (req, res) => {
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
      completedBy,
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
router.put('/submissions/:id', async (req, res) => {
  try {
    const { answers, notes, status } = req.body;
    
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

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

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
router.delete('/submissions/:id', async (req, res) => {
  try {
    const deletedSubmission = await FormSubmission.findByIdAndDelete(req.params.id);
    
    if (!deletedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Failed to delete submission' });
  }
});

// GET all submissions (for admin/analytics)
router.get('/submissions', async (req, res) => {
  try {
    const { page = 1, limit = 10, questionnaireId, status } = req.query;
    
    const filter = {};
    if (questionnaireId) filter.questionnaireId = questionnaireId;
    if (status) filter.status = status;
    
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

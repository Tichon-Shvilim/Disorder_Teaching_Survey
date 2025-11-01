const express = require('express');
const axios = require('axios');
const Analytics = require('../models/Analytics');
const SubmissionAnalytics = require('../models/SubmissionAnalytics');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const { 
  extractDomainScores, 
  calculateOverallScore 
} = require('../utils/scoringUtils');
const router = express.Router();

// Log a new action
router.post('/log', async (req, res) => {
  const analytics = new Analytics(req.body);
  await analytics.save();
  res.status(201).send(analytics);
});

// Get analytics data
router.get('/', async (req, res) => {
  const analyticsData = await Analytics.find().populate('userId');
  res.send(analyticsData);
});



// Helper function to calculate standard deviation
function calculateStandardDeviation(values) {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}



// Calculate and store analytics for a form submission (internal endpoint)
router.post('/calculate/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Check if analytics already exist
    const existingAnalytics = await SubmissionAnalytics.findOne({ submissionId });
    if (existingAnalytics) {
      return res.json({
        success: true,
        message: 'Analytics already exist',
        data: existingAnalytics
      });
    }
    
    // Fetch submission data from form-service
    const formServiceUrl = process.env.FORM_SERVICE_URL || 'http://form-service:3003';
    
    // Get the submission
    const submissionResponse = await axios.get(
      `${formServiceUrl}/api/forms/submissions/${submissionId}`,
      { 
        headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {},
        timeout: 10000
      }
    );
    
    if (!submissionResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }
    
    const submission = submissionResponse.data.data;
    
    // Get the questionnaire structure
    const questionnaireResponse = await axios.get(
      `${formServiceUrl}/api/questionnaires/templates/${submission.questionnaireId}`,
      { 
        headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {},
        timeout: 10000
      }
    );
    
    if (!questionnaireResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }
    
    const questionnaire = questionnaireResponse.data.data;
    
    // Calculate domain scores
    const domainScores = extractDomainScores(submission, questionnaire.structure);
    
    // Calculate overall score
    const overallScoreData = calculateOverallScore(domainScores);
    
    // Check if analytics already exist
    let analytics = await SubmissionAnalytics.findOne({ submissionId });
    
    if (analytics) {
      // Update existing analytics
      analytics.overallScore = overallScoreData.totalScore;
      analytics.domainScores = domainScores;
      analytics.calculatedAt = new Date();
      analytics.isValid = true;
      analytics.version += 1;
    } else {
      // Create new analytics
      analytics = new SubmissionAnalytics({
        submissionId,
        studentId: submission.studentId,
        questionnaireId: submission.questionnaireId,
        studentName: submission.studentName,
        questionnaireTitle: submission.questionnaireTitle,
        submittedAt: submission.submittedAt,
        overallScore: overallScoreData.totalScore,
        domainScores: domainScores
      });
    }
    
    await analytics.save();
    
    res.json({
      success: true,
      message: 'Analytics calculated successfully',
      data: {
        submissionId,
        overallScore: overallScoreData.totalScore,
        domainScores: domainScores,
        calculatedAt: analytics.calculatedAt
      }
    });
    
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate analytics',
      error: error.message
    });
  }
});

// Get domain scores for a specific student
router.get('/domains/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { questionnaireId, latest = 'true' } = req.query;
    
    // Build query
    const query = { studentId };
    if (questionnaireId) {
      query.questionnaireId = questionnaireId;
    }
    
    let analytics;
    
    if (latest === 'true') {
      // Get latest submission for each questionnaire
      analytics = await SubmissionAnalytics.aggregate([
        { $match: query },
        { $sort: { submittedAt: -1 } },
        {
          $group: {
            _id: '$questionnaireId',
            latest: { $first: '$$ROOT' }
          }
        },
        { $replaceRoot: { newRoot: '$latest' } },
        { $sort: { submittedAt: -1 } }
      ]);
    } else {
      // Get all submissions
      analytics = await SubmissionAnalytics.find(query)
        .sort({ submittedAt: -1 });
    }
    
    // Aggregate domain scores across submissions
    const domainAggregation = {};
    
    analytics.forEach(submission => {
      submission.domainScores.forEach(domain => {
        const key = domain.nodeId;
        if (!domainAggregation[key]) {
          domainAggregation[key] = {
            nodeId: domain.nodeId,
            title: domain.title,
            scores: [],
            totalQuestions: domain.totalQuestions,
            submissions: 0
          };
        }
        
        domainAggregation[key].scores.push(domain.score);
        domainAggregation[key].submissions++;
      });
    });
    
    // Calculate averages
    const domainSummary = Object.values(domainAggregation).map(domain => ({
      nodeId: domain.nodeId,
      title: domain.title,
      averageScore: domain.scores.reduce((sum, score) => sum + score, 0) / domain.scores.length,
      latestScore: domain.scores[0], // First score is from latest submission
      totalQuestions: domain.totalQuestions,
      submissions: domain.submissions,
      trend: domain.scores.length > 1 ? 
        domain.scores[0] - domain.scores[domain.scores.length - 1] : 0
    }));
    
    res.json({
      success: true,
      data: {
        studentId,
        domains: domainSummary,
        totalSubmissions: analytics.length,
        dateRange: analytics.length > 0 ? {
          earliest: analytics[analytics.length - 1].submittedAt,
          latest: analytics[0].submittedAt
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching domain analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domain analytics',
      error: error.message
    });
  }
});

// Get class averages for domain scores
router.get('/domains/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { questionnaireId } = req.query;
    
    // Get students in class from student-service
    const studentServiceUrl = process.env.STUDENT_SERVICE_URL || 'http://student-service:3002';
    const studentsResponse = await axios.get(
      `${studentServiceUrl}/api/classes/${classId}/students`,
      { headers: req.headers }
    );
    
    if (!studentsResponse.data || !studentsResponse.data.students) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or no students in class'
      });
    }
    
    const studentIds = studentsResponse.data.students.map(s => s._id);
    
    // Build query
    const query = { 
      studentId: { $in: studentIds },
      isValid: true
    };
    
    if (questionnaireId) {
      query.questionnaireId = questionnaireId;
    }
    
    // Get latest submission for each student
    const analytics = await SubmissionAnalytics.aggregate([
      { $match: query },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: {
            studentId: '$studentId',
            questionnaireId: '$questionnaireId'
          },
          latest: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latest' } }
    ]);
    
    if (analytics.length === 0) {
      return res.json({
        success: true,
        data: {
          classId,
          domains: [],
          studentCount: studentIds.length,
          submissionCount: 0
        }
      });
    }
    
    // Aggregate domain scores across students
    const domainAggregation = {};
    
    analytics.forEach(submission => {
      submission.domainScores.forEach(domain => {
        const key = domain.nodeId;
        if (!domainAggregation[key]) {
          domainAggregation[key] = {
            nodeId: domain.nodeId,
            title: domain.title,
            scores: [],
            totalQuestions: domain.totalQuestions
          };
        }
        
        domainAggregation[key].scores.push(domain.score);
      });
    });
    
    // Calculate class averages
    const classAverages = Object.values(domainAggregation).map(domain => ({
      nodeId: domain.nodeId,
      title: domain.title,
      averageScore: domain.scores.reduce((sum, score) => sum + score, 0) / domain.scores.length,
      minScore: Math.min(...domain.scores),
      maxScore: Math.max(...domain.scores),
      totalQuestions: domain.totalQuestions,
      studentCount: domain.scores.length,
      standardDeviation: calculateStandardDeviation(domain.scores)
    }));
    
    res.json({
      success: true,
      data: {
        classId,
        domains: classAverages,
        studentCount: studentIds.length,
        submissionCount: analytics.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class analytics',
      error: error.message
    });
  }
});

// Get detailed analytics for a specific submission
router.get('/submission/:submissionId', authenticateJWT, async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    let analytics = await SubmissionAnalytics.findOne({ submissionId });
    
    if (!analytics) {
      // Try to calculate analytics if not found
      console.log(`Analytics not found for submission ${submissionId}, attempting to calculate...`);
      
      try {
        // Trigger calculation
        const calcResponse = await axios.post(
          `http://localhost:3004/api/analytics/calculate/${submissionId}`,
          {},
          { 
            headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {},
            timeout: 15000
          }
        );
        
        if (calcResponse.data.success) {
          // Fetch the newly calculated analytics
          analytics = await SubmissionAnalytics.findOne({ submissionId });
        }
      } catch (calcError) {
        console.error('Error calculating analytics:', calcError.message);
      }
    }
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics not found for this submission and calculation failed'
      });
    }
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Error fetching submission analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission analytics',
      error: error.message
    });
  }
});

// Get available questionnaires for a class
router.get('/questionnaires/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Get students in class from student-service
    const studentServiceUrl = process.env.STUDENT_SERVICE_URL || 'http://student-service:3002';
    const studentsResponse = await axios.get(
      `${studentServiceUrl}/api/classes/${classId}/students`,
      { headers: req.headers }
    );
    
    if (!studentsResponse.data || !studentsResponse.data.students) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or no students in class'
      });
    }
    
    const studentIds = studentsResponse.data.students.map(s => s._id);
    
    // Get all submissions for class students to find available questionnaires
    const formServiceUrl = process.env.FORM_SERVICE_URL || 'http://form-service:3003';
    const submissionsResponse = await axios.get(
      `${formServiceUrl}/api/forms/submissions/v2`,
      { 
        headers: req.headers,
        params: { 
          studentIds: studentIds.join(',')
        }
      }
    );
    
    if (!submissionsResponse.data?.success) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Extract unique questionnaire IDs
    const questionnaireIds = [...new Set(
      submissionsResponse.data.data
        .map(submission => submission.questionnaireId)
        .filter(id => id)
    )];
    
    // Get questionnaire details
    const questionnaires = [];
    for (const qId of questionnaireIds) {
      try {
        const qResponse = await axios.get(
          `${formServiceUrl}/api/questionnaires/v2/templates/${qId}`,
          { headers: req.headers }
        );
        
        if (qResponse.data?.success) {
          questionnaires.push({
            _id: qResponse.data.data._id,
            title: qResponse.data.data.title,
            description: qResponse.data.data.description,
            createdAt: qResponse.data.data.createdAt,
            version: qResponse.data.data.version
          });
        }
      } catch (err) {
        console.log(`Could not fetch questionnaire ${qId}:`, err.message);
      }
    }
    
    res.json({
      success: true,
      data: questionnaires
    });
    
  } catch (error) {
    console.error('Error fetching class questionnaires:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questionnaires',
      error: error.message
    });
  }
});

// Get analytics for class with specific questionnaire and date filtering
router.get('/class/:classId/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const { classId, questionnaireId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get students in class
    const studentServiceUrl = process.env.STUDENT_SERVICE_URL || 'http://student-service:3002';
    const studentsResponse = await axios.get(
      `${studentServiceUrl}/api/classes/${classId}/students`,
      { headers: req.headers }
    );
    
    if (!studentsResponse.data || !studentsResponse.data.students) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    const students = studentsResponse.data.students;
    const studentIds = students.map(s => s._id);
    
    // Get questionnaire structure
    const formServiceUrl = process.env.FORM_SERVICE_URL || 'http://form-service:3003';
    const questionnaireResponse = await axios.get(
      `${formServiceUrl}/api/questionnaires/v2/templates/${questionnaireId}`,
      { headers: req.headers }
    );
    
    if (!questionnaireResponse.data?.success) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }
    
    const questionnaire = questionnaireResponse.data.data;
    
    // Build query params for submissions with date filtering
    let submissionParams = {
      studentIds: studentIds.join(','),
      questionnaireId: questionnaireId
    };
    
    if (startDate) submissionParams.startDate = startDate;
    if (endDate) submissionParams.endDate = endDate;
    
    // Get filtered submissions
    const submissionsResponse = await axios.get(
      `${formServiceUrl}/api/forms/submissions/v2`,
      { 
        headers: req.headers,
        params: submissionParams
      }
    );
    
    if (!submissionsResponse.data?.success) {
      return res.json({
        success: true,
        data: {
          questionnaire: {
            id: questionnaire._id,
            title: questionnaire.title,
            description: questionnaire.description
          },
          classInfo: {
            id: classId,
            studentsCount: students.length
          },
          dateRange: { startDate, endDate },
          submissionsCount: 0,
          domains: []
        }
      });
    }
    
    const submissions = submissionsResponse.data.data;
    
    // Calculate domain scores for each submission
    const allDomainScores = [];
    
    submissions.forEach(submission => {
      const domainScores = extractDomainScores(submission, questionnaire.structure);
      allDomainScores.push(...domainScores);
    });
    
    // Aggregate by domain
    const domainAggregation = {};
    
    allDomainScores.forEach(domain => {
      const key = domain.nodeId;
      if (!domainAggregation[key]) {
        domainAggregation[key] = {
          nodeId: domain.nodeId,
          title: domain.title,
          scores: [],
          totalQuestions: domain.totalQuestions
        };
      }
      
      domainAggregation[key].scores.push(domain.score);
    });
    
    // Calculate class averages
    const classAverages = Object.values(domainAggregation).map(domain => ({
      nodeId: domain.nodeId,
      title: domain.title,
      averageScore: domain.scores.length > 0 ? 
        domain.scores.reduce((sum, score) => sum + score, 0) / domain.scores.length : 0,
      minScore: domain.scores.length > 0 ? Math.min(...domain.scores) : 0,
      maxScore: domain.scores.length > 0 ? Math.max(...domain.scores) : 0,
      totalQuestions: domain.totalQuestions,
      studentCount: domain.scores.length,
      standardDeviation: calculateStandardDeviation(domain.scores)
    }));
    
    res.json({
      success: true,
      data: {
        questionnaire: {
          id: questionnaire._id,
          title: questionnaire.title,
          description: questionnaire.description
        },
        classInfo: {
          id: classId,
          studentsCount: students.length
        },
        dateRange: { startDate, endDate },
        submissionsCount: submissions.length,
        domains: classAverages
      }
    });
    
  } catch (error) {
    console.error('Error calculating class questionnaire analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate analytics',
      error: error.message
    });
  }
});

// Get analytics for student with specific questionnaire and date filtering
router.get('/student/:studentId/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const { studentId, questionnaireId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get questionnaire structure
    const formServiceUrl = process.env.FORM_SERVICE_URL || 'http://form-service:3003';
    const questionnaireResponse = await axios.get(
      `${formServiceUrl}/api/questionnaires/v2/templates/${questionnaireId}`,
      { headers: req.headers }
    );
    
    if (!questionnaireResponse.data?.success) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }
    
    const questionnaire = questionnaireResponse.data.data;
    
    // Build query params with date filtering
    let submissionParams = {
      studentIds: studentId,
      questionnaireId: questionnaireId
    };
    
    if (startDate) submissionParams.startDate = startDate;
    if (endDate) submissionParams.endDate = endDate;
    
    // Get submissions
    const submissionsResponse = await axios.get(
      `${formServiceUrl}/api/forms/submissions/v2`,
      { 
        headers: req.headers,
        params: submissionParams
      }
    );
    
    if (!submissionsResponse.data?.success) {
      return res.json({
        success: true,
        data: {
          questionnaire: {
            id: questionnaire._id,
            title: questionnaire.title
          },
          studentId: studentId,
          dateRange: { startDate, endDate },
          submissionsCount: 0,
          domains: []
        }
      });
    }
    
    const submissions = submissionsResponse.data.data;
    
    // Get latest submission for analysis
    const latestSubmission = submissions.sort((a, b) => 
      new Date(b.submittedAt) - new Date(a.submittedAt)
    )[0];
    
    if (!latestSubmission) {
      return res.json({
        success: true,
        data: {
          questionnaire: {
            id: questionnaire._id,
            title: questionnaire.title
          },
          studentId: studentId,
          dateRange: { startDate, endDate },
          submissionsCount: 0,
          domains: []
        }
      });
    }
    
    // Calculate domain scores
    const domainScores = extractDomainScores(latestSubmission, questionnaire.structure);
    
    res.json({
      success: true,
      data: {
        questionnaire: {
          id: questionnaire._id,
          title: questionnaire.title
        },
        studentId: studentId,
        dateRange: { startDate, endDate },
        submissionsCount: submissions.length,
        domains: domainScores.map(domain => ({
          nodeId: domain.nodeId,
          title: domain.title,
          averageScore: domain.score,
          totalQuestions: domain.totalQuestions,
          submissions: submissions.length
        }))
      }
    });
    
  } catch (error) {
    console.error('Error calculating student questionnaire analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate analytics',
      error: error.message
    });
  }
});

// Helper function to calculate standard deviation
function calculateStandardDeviation(values) {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

module.exports = router;
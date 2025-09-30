const express = require('express');
const mongoose = require('mongoose');
const FormSubmission = require('../models/FormSubmission');
const QuestionnaireTemplate = require('../models/QuestionnaireTemplate');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

const router = express.Router();

/**
 * Normalize an answer to 0-100% scale based on question type and options
 */
function normalizeAnswer(answer, inputType, options = [], scaleMin = null, scaleMax = null) {
  switch (inputType) {
    case 'single-choice':
      if (options.length === 0) return 0;
      const selectedOption = options.find(opt => opt.value === answer || opt.id === answer);
      if (!selectedOption) return 0;
      
      const minValue = Math.min(...options.map(opt => opt.value));
      const maxValue = Math.max(...options.map(opt => opt.value));
      
      if (minValue === maxValue) return 100;
      return ((selectedOption.value - minValue) / (maxValue - minValue)) * 100;

    case 'multiple-choice':
      if (!Array.isArray(answer) || options.length === 0) return 0;
      
      // Calculate average of selected options
      const selectedValues = answer.map(val => {
        const opt = options.find(o => o.value === val || o.id === val);
        return opt ? opt.value : 0;
      });
      
      if (selectedValues.length === 0) return 0;
      
      const avgSelected = selectedValues.reduce((sum, val) => sum + val, 0) / selectedValues.length;
      const minVal = Math.min(...options.map(opt => opt.value));
      const maxVal = Math.max(...options.map(opt => opt.value));
      
      if (minVal === maxVal) return 100;
      return ((avgSelected - minVal) / (maxVal - minVal)) * 100;

    case 'scale':
      const min = scaleMin !== null ? scaleMin : (options.length > 0 ? Math.min(...options.map(opt => opt.value)) : 0);
      const max = scaleMax !== null ? scaleMax : (options.length > 0 ? Math.max(...options.map(opt => opt.value)) : 10);
      
      if (min === max) return 100;
      const clampedAnswer = Math.max(min, Math.min(max, Number(answer)));
      return ((clampedAnswer - min) / (max - min)) * 100;

    case 'number':
      // For number inputs, use provided range or default 0-100
      const numMin = scaleMin !== null ? scaleMin : 0;
      const numMax = scaleMax !== null ? scaleMax : 100;
      
      if (numMin === numMax) return 100;
      const clampedNum = Math.max(numMin, Math.min(numMax, Number(answer)));
      return ((clampedNum - numMin) / (numMax - numMin)) * 100;

    case 'text':
      // Text answers can't be easily normalized to numeric scores
      // Return 50% as neutral, or implement custom logic based on requirements
      return 50;

    default:
      return 0;
  }
}

/**
 * Recursively extract all question nodes from a tree node
 */
function extractQuestionsFromNode(node) {
  const questions = [];
  
  if (node.type === 'question') {
    questions.push(node);
  }
  
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      questions.push(...extractQuestionsFromNode(child));
    });
  }
  
  return questions;
}

/**
 * Extract all nodes (groups and questions) from structure with their paths
 */
function extractAllNodesWithPaths(structure, parentPath = []) {
  const nodes = [];
  
  structure.forEach(node => {
    const currentPath = [...parentPath, node.id];
    
    nodes.push({
      ...node,
      nodePath: currentPath,
      depth: currentPath.length
    });
    
    if (node.children && node.children.length > 0) {
      nodes.push(...extractAllNodesWithPaths(node.children, currentPath));
    }
  });
  
  return nodes;
}

/**
 * Calculate score for a specific node (group or question)
 */
function calculateNodeScore(nodeId, nodePath, answers, questionNodes, nodeTitle) {
  // Filter answers that belong to this node or its children
  const nodeAnswers = answers.filter(answer => {
    if (!answer.nodePath || answer.nodePath.length === 0) return false;
    
    // Check if answer's path starts with this node's path
    if (answer.nodePath.length < nodePath.length) return false;
    
    for (let i = 0; i < nodePath.length; i++) {
      if (answer.nodePath[i] !== nodePath[i]) return false;
    }
    
    return true;
  });

  if (nodeAnswers.length === 0) {
    return {
      nodeId,
      nodePath: [...nodePath],
      title: nodeTitle,
      score: 0,
      maxScore: 100,
      answeredQuestions: 0,
      totalQuestions: questionNodes.length,
      weightedScore: 0,
      totalWeight: 0,
      details: []
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const details = [];

  nodeAnswers.forEach(answer => {
    if (!answer.graphable) return; // Skip non-graphable questions
    
    // Find corresponding question node for options
    const questionNode = questionNodes.find(q => q.id === answer.questionId);
    const options = questionNode?.options || [];
    const scaleMin = questionNode?.scaleMin || null;
    const scaleMax = questionNode?.scaleMax || null;
    
    // Normalize the answer
    const normalizedScore = normalizeAnswer(answer.answer, answer.inputType, options, scaleMin, scaleMax);
    
    // Apply weight
    const weight = answer.weight || 1;
    const weightedScore = normalizedScore * weight;
    
    totalWeightedScore += weightedScore;
    totalWeight += weight;
    
    details.push({
      questionId: answer.questionId,
      questionTitle: answer.questionTitle,
      rawAnswer: answer.answer,
      normalizedScore: Math.round(normalizedScore * 100) / 100,
      weight: weight,
      weightedScore: Math.round(weightedScore * 100) / 100,
      nodePath: [...answer.nodePath]
    });
  });

  if (totalWeight === 0) {
    return {
      nodeId,
      nodePath: [...nodePath],
      title: nodeTitle,
      score: 0,
      maxScore: 100,
      answeredQuestions: 0,
      totalQuestions: questionNodes.length,
      weightedScore: 0,
      totalWeight: 0,
      details: []
    };
  }

  const finalScore = totalWeightedScore / totalWeight;

  return {
    nodeId,
    nodePath: [...nodePath],
    title: nodeTitle,
    score: Math.round(finalScore * 100) / 100,
    maxScore: 100,
    answeredQuestions: nodeAnswers.filter(a => a.graphable).length,
    totalQuestions: questionNodes.filter(q => q.graphable).length,
    weightedScore: Math.round(totalWeightedScore * 100) / 100,
    totalWeight: totalWeight,
    details: details
  };
}

/**
 * Calculate scores for all nodes in a submission
 */
function calculateAllNodeScores(submission, questionnaireStructure) {
  if (!submission?.answers || !questionnaireStructure) {
    return [];
  }

  // Extract all nodes with their paths
  const allNodes = extractAllNodesWithPaths(questionnaireStructure);
  
  // Get all questions for reference
  const allQuestions = [];
  questionnaireStructure.forEach(rootNode => {
    allQuestions.push(...extractQuestionsFromNode(rootNode));
  });

  // Calculate scores for each node
  const nodeScores = [];
  
  allNodes.forEach(node => {
    if (node.type === 'group') {
      // For groups, get all questions under this node
      const nodeQuestions = extractQuestionsFromNode(node);
      
      const scoreData = calculateNodeScore(
        node.id, 
        node.nodePath, 
        submission.answers, 
        nodeQuestions, 
        node.title
      );
      
      // Only include groups that have graphable questions
      if (nodeQuestions.some(q => q.graphable)) {
        nodeScores.push(scoreData);
      }
    }
  });

  return nodeScores;
}

// Calculate scores for a specific submission
router.get('/submissions/:id/scores', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    // Fetch submission with full answers
    const submission = await FormSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }

    // Fetch questionnaire template for structure
    const questionnaire = await QuestionnaireTemplate.findById(submission.questionnaireId);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }

    // Calculate all node scores
    const nodeScores = calculateAllNodeScores(submission, questionnaire.structure);
    
    // Calculate overall score
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    nodeScores.forEach(nodeScore => {
      if (nodeScore.nodePath.length === 1) { // Root level domains only
        totalWeightedScore += nodeScore.weightedScore;
        totalWeight += nodeScore.totalWeight;
      }
    });
    
    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    res.json({
      success: true,
      data: {
        submissionId: submission._id,
        studentName: submission.studentName,
        questionnaireTitle: submission.questionnaireTitle,
        submittedAt: submission.submittedAt,
        overallScore: Math.round(overallScore * 100) / 100,
        totalWeight: totalWeight,
        nodeScores: nodeScores,
        graphSettings: questionnaire.graphSettings
      }
    });

  } catch (error) {
    console.error('Error calculating submission scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate scores',
      error: error.message
    });
  }
});

// Calculate scores for multiple submissions (for group analytics)
router.post('/submissions/bulk-scores', authenticateJWT, async (req, res) => {
  try {
    const { submissionIds, questionnaireId, groupBy } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'submissionIds array is required'
      });
    }

    // Validate submission IDs
    const invalidIds = submissionIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid submission IDs: ${invalidIds.join(', ')}`
      });
    }

    // Build query
    let query = { _id: { $in: submissionIds.map(id => new mongoose.Types.ObjectId(id)) } };
    
    if (questionnaireId) {
      if (!mongoose.Types.ObjectId.isValid(questionnaireId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid questionnaire ID format'
        });
      }
      query.questionnaireId = new mongoose.Types.ObjectId(questionnaireId);
    }

    // Fetch submissions
    const submissions = await FormSubmission.find(query);
    
    if (submissions.length === 0) {
      return res.json({
        success: true,
        data: {
          submissions: [],
          aggregatedScores: {},
          totalSubmissions: 0
        }
      });
    }

    // Get questionnaire template (use first submission's questionnaire if not specified)
    const templateId = questionnaireId || submissions[0].questionnaireId;
    const questionnaire = await QuestionnaireTemplate.findById(templateId);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }

    // Calculate scores for each submission
    const submissionScores = submissions.map(submission => {
      const nodeScores = calculateAllNodeScores(submission, questionnaire.structure);
      
      // Calculate overall score
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      nodeScores.forEach(nodeScore => {
        if (nodeScore.nodePath.length === 1) { // Root level domains only
          totalWeightedScore += nodeScore.weightedScore;
          totalWeight += nodeScore.totalWeight;
        }
      });
      
      const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      
      return {
        submissionId: submission._id,
        studentId: submission.studentId,
        studentName: submission.studentName,
        submittedAt: submission.submittedAt,
        overallScore: Math.round(overallScore * 100) / 100,
        nodeScores: nodeScores
      };
    });

    // Aggregate scores by node
    const aggregatedScores = {};
    
    // Get all unique node paths from all submissions
    const allNodePaths = new Set();
    submissionScores.forEach(submission => {
      submission.nodeScores.forEach(nodeScore => {
        allNodePaths.add(nodeScore.nodePath.join('/'));
      });
    });

    // Calculate aggregated statistics for each node
    allNodePaths.forEach(nodePathStr => {
      const nodePath = nodePathStr.split('/');
      const nodeScoresForPath = [];
      
      submissionScores.forEach(submission => {
        const nodeScore = submission.nodeScores.find(ns => 
          ns.nodePath.join('/') === nodePathStr
        );
        if (nodeScore) {
          nodeScoresForPath.push(nodeScore.score);
        }
      });

      if (nodeScoresForPath.length > 0) {
        const scores = nodeScoresForPath.sort((a, b) => a - b);
        const sum = scores.reduce((acc, score) => acc + score, 0);
        const avg = sum / scores.length;
        
        // Find node info from questionnaire
        const nodeInfo = findNodeByPath(questionnaire.structure, nodePath);
        
        aggregatedScores[nodePathStr] = {
          nodePath: nodePath,
          nodeTitle: nodeInfo?.title || nodePath[nodePath.length - 1],
          submissionCount: scores.length,
          averageScore: Math.round(avg * 100) / 100,
          medianScore: scores.length % 2 === 0 
            ? (scores[Math.floor(scores.length / 2) - 1] + scores[Math.floor(scores.length / 2)]) / 2
            : scores[Math.floor(scores.length / 2)],
          minScore: Math.min(...scores),
          maxScore: Math.max(...scores),
          standardDeviation: Math.sqrt(
            scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length
          ),
          scores: scores
        };
      }
    });

    res.json({
      success: true,
      data: {
        questionnaire: {
          id: questionnaire._id,
          title: questionnaire.title,
          graphSettings: questionnaire.graphSettings
        },
        submissions: submissionScores,
        aggregatedScores: aggregatedScores,
        totalSubmissions: submissionScores.length
      }
    });

  } catch (error) {
    console.error('Error calculating bulk scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate bulk scores',
      error: error.message
    });
  }
});

// Helper function to find node by path in questionnaire structure
function findNodeByPath(structure, nodePath) {
  if (!nodePath || nodePath.length === 0) return null;
  
  let currentNodes = structure;
  let currentNode = null;
  
  for (let i = 0; i < nodePath.length; i++) {
    const nodeId = nodePath[i];
    currentNode = currentNodes.find(node => node.id === nodeId);
    
    if (!currentNode) return null;
    
    if (i < nodePath.length - 1) {
      currentNodes = currentNode.children || [];
    }
  }
  
  return currentNode;
}

// Get scoring metadata for a questionnaire (for analytics setup)
router.get('/questionnaires/:id/scoring-metadata', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid questionnaire ID format'
      });
    }

    const questionnaire = await QuestionnaireTemplate.findById(id);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }

    // Extract all nodes with metadata
    const allNodes = extractAllNodesWithPaths(questionnaire.structure);
    
    // Get groups that have graphable questions
    const graphableGroups = allNodes.filter(node => {
      if (node.type === 'group') {
        const questions = extractQuestionsFromNode(node);
        return questions.some(q => q.graphable);
      }
      return false;
    });

    // Get all graphable questions
    const graphableQuestions = allNodes.filter(node => 
      node.type === 'question' && node.graphable
    );

    res.json({
      success: true,
      data: {
        questionnaire: {
          id: questionnaire._id,
          title: questionnaire.title,
          graphSettings: questionnaire.graphSettings
        },
        graphableGroups: graphableGroups.map(group => ({
          nodeId: group.id,
          nodePath: group.nodePath,
          title: group.title,
          depth: group.depth,
          questionCount: extractQuestionsFromNode(group).filter(q => q.graphable).length
        })),
        graphableQuestions: graphableQuestions.map(question => ({
          nodeId: question.id,
          nodePath: question.nodePath,
          title: question.title,
          inputType: question.inputType,
          options: question.options,
          weight: question.weight,
          preferredChartType: question.preferredChartType
        })),
        totalGraphableNodes: graphableGroups.length,
        totalGraphableQuestions: graphableQuestions.length
      }
    });

  } catch (error) {
    console.error('Error fetching scoring metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scoring metadata',
      error: error.message
    });
  }
});

// Update submission with calculated scores (store them in the submission)
router.put('/submissions/:id/update-scores', authenticateJWT, authorizeRole(['Admin', 'Teacher', 'Therapist']), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    // Fetch submission
    const submission = await FormSubmission.findById(id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }

    // Fetch questionnaire template
    const questionnaire = await QuestionnaireTemplate.findById(submission.questionnaireId);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }

    // Calculate scores
    const nodeScores = calculateAllNodeScores(submission, questionnaire.structure);
    
    // Calculate overall score
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    // Map nodeScores to domainScores format (only root level nodes)
    const domainScores = nodeScores
      .filter(nodeScore => nodeScore.nodePath.length === 1) // Root level only
      .map(nodeScore => {
        totalWeightedScore += nodeScore.weightedScore;
        totalWeight += nodeScore.totalWeight;
        
        return {
          nodeId: nodeScore.nodeId,
          nodePath: nodeScore.nodePath,
          title: nodeScore.title,
          score: nodeScore.score,
          maxScore: nodeScore.maxScore,
          answeredQuestions: nodeScore.answeredQuestions,
          totalQuestions: nodeScore.totalQuestions,
          weightedScore: nodeScore.weightedScore,
          totalWeight: nodeScore.totalWeight
        };
      });
    
    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Update submission with calculated scores
    const updatedSubmission = await FormSubmission.findByIdAndUpdate(
      id,
      {
        totalScore: Math.round(overallScore * 100) / 100,
        domainScores: domainScores,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Scores updated successfully',
      data: {
        submissionId: updatedSubmission._id,
        totalScore: updatedSubmission.totalScore,
        domainScores: updatedSubmission.domainScores,
        allNodeScores: nodeScores // Include all calculated scores in response
      }
    });

  } catch (error) {
    console.error('Error updating submission scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scores',
      error: error.message
    });
  }
});

// Batch update scores for multiple submissions
router.put('/submissions/batch-update-scores', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { submissionIds, questionnaireId } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'submissionIds array is required'
      });
    }

    // Validate submission IDs
    const invalidIds = submissionIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid submission IDs: ${invalidIds.join(', ')}`
      });
    }

    // Build query
    let query = { _id: { $in: submissionIds.map(id => new mongoose.Types.ObjectId(id)) } };
    
    if (questionnaireId) {
      if (!mongoose.Types.ObjectId.isValid(questionnaireId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid questionnaire ID format'
        });
      }
      query.questionnaireId = new mongoose.Types.ObjectId(questionnaireId);
    }

    const submissions = await FormSubmission.find(query);
    const updatedSubmissions = [];
    const errors = [];

    for (const submission of submissions) {
      try {
        // Fetch questionnaire template
        const questionnaire = await QuestionnaireTemplate.findById(submission.questionnaireId);
        
        if (!questionnaire) {
          errors.push({
            submissionId: submission._id,
            error: 'Questionnaire template not found'
          });
          continue;
        }

        // Calculate scores
        const nodeScores = calculateAllNodeScores(submission, questionnaire.structure);
        
        // Calculate overall score and domain scores
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        const domainScores = nodeScores
          .filter(nodeScore => nodeScore.nodePath.length === 1)
          .map(nodeScore => {
            totalWeightedScore += nodeScore.weightedScore;
            totalWeight += nodeScore.totalWeight;
            
            return {
              nodeId: nodeScore.nodeId,
              nodePath: nodeScore.nodePath,
              title: nodeScore.title,
              score: nodeScore.score,
              maxScore: nodeScore.maxScore,
              answeredQuestions: nodeScore.answeredQuestions,
              totalQuestions: nodeScore.totalQuestions,
              weightedScore: nodeScore.weightedScore,
              totalWeight: nodeScore.totalWeight
            };
          });
        
        const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

        // Update submission
        await FormSubmission.findByIdAndUpdate(
          submission._id,
          {
            totalScore: Math.round(overallScore * 100) / 100,
            domainScores: domainScores,
            updatedAt: new Date()
          }
        );

        updatedSubmissions.push({
          submissionId: submission._id,
          studentName: submission.studentName,
          totalScore: Math.round(overallScore * 100) / 100,
          domainCount: domainScores.length
        });

      } catch (error) {
        errors.push({
          submissionId: submission._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedSubmissions.length} submissions`,
      data: {
        updatedSubmissions,
        errors,
        totalProcessed: submissions.length,
        successCount: updatedSubmissions.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Error batch updating scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch update scores',
      error: error.message
    });
  }
});

module.exports = router;

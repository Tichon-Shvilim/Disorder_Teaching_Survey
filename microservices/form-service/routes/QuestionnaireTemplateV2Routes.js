const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const QuestionnaireTemplateV2 = require('../models/QuestionnaireTemplateV2');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const { 
  validateTreeStructure, 
  validateConditionalLogic,
  extractAllQuestions,
  generateNodePaths,
  calculateMaxScore 
} = require('../utils/treeUtils');

const router = express.Router();

// Helper function to fetch user data from user-service
async function fetchUserData(userId, authHeader) {
  try {
    const userResponse = await axios.get(
      `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${userId}`,
      { headers: { Authorization: authHeader } }
    );
    return userResponse.data;
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    return null;
  }
}

// Helper function to enrich questionnaires with user data
async function enrichWithUserData(questionnaires, authHeader) {
  if (!Array.isArray(questionnaires)) {
    questionnaires = [questionnaires];
  }

  const userIds = [...new Set(questionnaires.map(q => q.createdBy).filter(Boolean))];
  const userDataMap = {};

  // Fetch all unique users
  await Promise.all(
    userIds.map(async (userId) => {
      const userData = await fetchUserData(userId, authHeader);
      if (userData) {
        userDataMap[userId] = {
          name: userData.name,
          email: userData.email
        };
      }
    })
  );

  // Enrich questionnaires with user data
  return questionnaires.map(questionnaire => {
    const questionnaireObj = questionnaire.toObject ? questionnaire.toObject() : questionnaire;
    const userData = userDataMap[questionnaireObj.createdBy];
    
    return {
      ...questionnaireObj,
      createdBy: userData || questionnaireObj.createdBy
    };
  });
}

// Create new enhanced questionnaire template - Admin only
router.post('/v2/templates', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { title, description, structure, graphSettings } = req.body;
    
    // Validate required fields
    if (!title || !structure || !Array.isArray(structure)) {
      return res.status(400).json({
        success: false,
        message: 'Title and structure are required. Structure must be an array.'
      });
    }
    
    // Validate tree structure
    const structureErrors = validateTreeStructure(structure);
    if (structureErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tree structure validation failed',
        errors: structureErrors
      });
    }
    
    // Validate conditional logic
    const conditionErrors = validateConditionalLogic(structure);
    if (conditionErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Conditional logic validation failed',
        errors: conditionErrors
      });
    }
    
    // Get user ID from JWT
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Valid user authentication is required'
      });
    }
    
    // Create the questionnaire template
    const questionnaireTemplate = new QuestionnaireTemplateV2({
      title,
      description,
      structure,
      graphSettings: graphSettings || { colorRanges: [] },
      createdBy: userId
    });

    await questionnaireTemplate.save();
    
    // Add some metadata to the response
    const questions = extractAllQuestions(structure);
    const nodePaths = generateNodePaths(structure);
    const maxScore = calculateMaxScore(structure);
    
    res.status(201).json({
      success: true,
      message: 'Enhanced questionnaire template created successfully',
      data: questionnaireTemplate,
      metadata: {
        totalQuestions: questions.length,
        totalNodes: nodePaths.length,
        maxPossibleScore: maxScore,
        graphableQuestions: questions.filter(q => q.graphable).length
      }
    });
  } catch (error) {
    console.error('Error creating enhanced questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create enhanced questionnaire template',
      error: error.message
    });
  }
});

// Get all enhanced questionnaire templates - All authenticated users can view
router.get('/v2/templates', authenticateJWT, async (req, res) => {
  try {
    const templates = await QuestionnaireTemplateV2.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    // Enrich templates with user data
    const enrichedTemplates = await enrichWithUserData(templates, req.headers.authorization);
    
    // Add metadata for each template
    const templatesWithMetadata = enrichedTemplates.map(template => {
      const questions = extractAllQuestions(template.structure);
      const nodePaths = generateNodePaths(template.structure);
      const maxScore = calculateMaxScore(template.structure);
      
      return {
        ...template,
        metadata: {
          totalQuestions: questions.length,
          totalNodes: nodePaths.length,
          maxPossibleScore: maxScore,
          graphableQuestions: questions.filter(q => q.graphable).length
        }
      };
    });
    
    res.json({
      success: true,
      data: templatesWithMetadata
    });
  } catch (error) {
    console.error('Error fetching enhanced questionnaire templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced questionnaire templates',
      error: error.message
    });
  }
});

// Get enhanced questionnaire template by ID - All authenticated users can view
router.get('/v2/templates/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ObjectId provided:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid questionnaire template ID format'
      });
    }
    
    const template = await QuestionnaireTemplateV2.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced questionnaire template not found'
      });
    }

    // Enrich template with user data
    const [enrichedTemplate] = await enrichWithUserData([template], req.headers.authorization);

    // Add metadata
    const questions = extractAllQuestions(enrichedTemplate.structure);
    const nodePaths = generateNodePaths(enrichedTemplate.structure);
    const maxScore = calculateMaxScore(enrichedTemplate.structure);
    
    res.json({
      success: true,
      data: {
        ...enrichedTemplate,
        metadata: {
          totalQuestions: questions.length,
          totalNodes: nodePaths.length,
          maxPossibleScore: maxScore,
          graphableQuestions: questions.filter(q => q.graphable).length,
          nodePaths: nodePaths // Include all node paths for frontend
        }
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced questionnaire template',
      error: error.message
    });
  }
});

// Update enhanced questionnaire template - Admin only
router.put('/v2/templates/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { title, description, structure, graphSettings } = req.body;
    
    // Validate structure if provided
    if (structure) {
      const structureErrors = validateTreeStructure(structure);
      if (structureErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tree structure validation failed',
          errors: structureErrors
        });
      }
      
      const conditionErrors = validateConditionalLogic(structure);
      if (conditionErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Conditional logic validation failed',
          errors: conditionErrors
        });
      }
    }
    
    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(structure && { structure }),
      ...(graphSettings && { graphSettings }),
      $inc: { version: 1 }
    };
    
    const template = await QuestionnaireTemplateV2.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced questionnaire template not found'
      });
    }

    // Add metadata
    const questions = extractAllQuestions(template.structure);
    const maxScore = calculateMaxScore(template.structure);

    res.json({
      success: true,
      message: 'Enhanced questionnaire template updated successfully',
      data: {
        ...template.toObject(),
        metadata: {
          totalQuestions: questions.length,
          maxPossibleScore: maxScore,
          graphableQuestions: questions.filter(q => q.graphable).length
        }
      }
    });
  } catch (error) {
    console.error('Error updating enhanced questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update enhanced questionnaire template',
      error: error.message
    });
  }
});

// Soft delete enhanced questionnaire template - Admin only
router.delete('/v2/templates/:id', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const template = await QuestionnaireTemplateV2.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced questionnaire template not found'
      });
    }

    res.json({
      success: true,
      message: 'Enhanced questionnaire template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enhanced questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete enhanced questionnaire template',
      error: error.message
    });
  }
});

// Get all questions from a template (flattened) - For analytics and form filling
router.get('/v2/templates/:id/questions', authenticateJWT, async (req, res) => {
  try {
    const template = await QuestionnaireTemplateV2.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Enhanced questionnaire template not found'
      });
    }

    const questions = extractAllQuestions(template.structure);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions from enhanced template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions from enhanced template',
      error: error.message
    });
  }
});

// Validate template structure without saving - Admin only
router.post('/v2/templates/validate', authenticateJWT, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { structure } = req.body;
    
    if (!structure || !Array.isArray(structure)) {
      return res.status(400).json({
        success: false,
        message: 'Structure is required and must be an array'
      });
    }
    
    const structureErrors = validateTreeStructure(structure);
    const conditionErrors = validateConditionalLogic(structure);
    const allErrors = [...structureErrors, ...conditionErrors];
    
    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: allErrors
      });
    }
    
    // If validation passes, return metadata
    const questions = extractAllQuestions(structure);
    const nodePaths = generateNodePaths(structure);
    const maxScore = calculateMaxScore(structure);
    
    res.json({
      success: true,
      message: 'Structure is valid',
      metadata: {
        totalQuestions: questions.length,
        totalNodes: nodePaths.length,
        maxPossibleScore: maxScore,
        graphableQuestions: questions.filter(q => q.graphable).length,
        nodePaths: nodePaths
      }
    });
  } catch (error) {
    console.error('Error validating template structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate template structure',
      error: error.message
    });
  }
});

module.exports = router;

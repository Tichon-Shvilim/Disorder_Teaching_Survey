const express = require('express');
const QuestionnaireTemplate = require('../models/QuestionnaireTemplate');
const router = express.Router();

// Create new questionnaire template
router.post('/templates', async (req, res) => {
  try {
    const { title, description, domains, questions } = req.body;
    
    // Process domains - assign clean sequential IDs
    const processedDomains = domains.map((domain, index) => ({
      id: `domain-${index}`, // Clean sequential IDs
      name: domain.name,
      description: domain.description,
      color: domain.color
    }));

    // Create mapping from temp frontend IDs to clean domain IDs
    const tempIdToCleanIdMap = new Map();
    domains.forEach((domain, index) => {
      const cleanId = `domain-${index}`;
      // Map temp frontend ID to clean domain ID
      if (domain.id) tempIdToCleanIdMap.set(domain.id, cleanId);
      if (domain._id) tempIdToCleanIdMap.set(domain._id, cleanId);
    });

    // Process questions and convert temp domainId to clean domainId
    const processedQuestions = questions.map((question, questionIndex) => {
      // Convert temp domainId to clean domainId
      const cleanDomainId = tempIdToCleanIdMap.get(question.domainId) || 'domain-0';
      
      return {
        text: question.text,
        domainId: cleanDomainId, // Store clean domain ID, not name
        type: question.type,
        options: question.options.map((option, optionIndex) => ({
          id: option.id || `opt-${questionIndex}-${optionIndex}`,
          value: option.value,
          label: option.label,
          subQuestions: (option.subQuestions || []).map(subQ => ({
            ...subQ,
            domainId: tempIdToCleanIdMap.get(subQ.domainId) || cleanDomainId // Fix sub-questions too
          }))
        })),
        required: question.required,
        helpText: question.helpText,
        order: question.order,
        parentQuestionId: question.parentQuestionId,
        parentOptionId: question.parentOptionId
      };
    });

    const questionnaireTemplate = new QuestionnaireTemplate({
      title,
      description,
      domains: processedDomains,
      questions: processedQuestions,
      createdBy: req.headers['user-id'] || 'system'
    });

    await questionnaireTemplate.save();
    res.status(201).json({
      success: true,
      message: 'Questionnaire template created successfully',
      data: questionnaireTemplate
    });
  } catch (error) {
    console.error('Error creating questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create questionnaire template',
      error: error.message
    });
  }
});

// Get all questionnaire templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await QuestionnaireTemplate.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching questionnaire templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questionnaire templates',
      error: error.message
    });
  }
});

// Get questionnaire template by ID
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await QuestionnaireTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questionnaire template',
      error: error.message
    });
  }
});

// Update questionnaire template
router.put('/templates/:id', async (req, res) => {
  try {
    const { title, description, domains, questions } = req.body;
    
    const template = await QuestionnaireTemplate.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        domains,
        questions,
        version: { $inc: 1 } // Increment version
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }

    res.json({
      success: true,
      message: 'Questionnaire template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update questionnaire template',
      error: error.message
    });
  }
});

// Soft delete questionnaire template
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await QuestionnaireTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire template not found'
      });
    }

    res.json({
      success: true,
      message: 'Questionnaire template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting questionnaire template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete questionnaire template',
      error: error.message
    });
  }
});

// Get all domains from existing templates (for reference)
router.get('/domains', async (req, res) => {
  try {
    const templates = await QuestionnaireTemplate.find({ isActive: true });
    const domainsSet = new Set();
    
    templates.forEach(template => {
      template.domains.forEach(domain => {
        domainsSet.add(JSON.stringify({
          id: domain.id,
          name: domain.name,
          description: domain.description,
          color: domain.color
        }));
      });
    });
    
    const uniqueDomains = Array.from(domainsSet).map(domainStr => JSON.parse(domainStr));
    
    res.json({
      success: true,
      data: uniqueDomains
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domains',
      error: error.message
    });
  }
});

module.exports = router;

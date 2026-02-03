/**
 * Scoring and analytics utilities for V2 questionnaire responses
 * Handles normalized scoring and domain aggregation
 */

/**
 * Normalize an answer to 0-100% scale
 * @param {*} answer - The raw answer value
 * @param {string} inputType - Type of input (single-choice, scale, etc.)
 * @param {Array} options - Available options (for choice-based questions)
 * @param {Object} questionNode - The question node with scale properties
 * @returns {number} Normalized score (0-100)
 */
function normalizeAnswer(answer, inputType, options = [], questionNode = null) {
  switch (inputType) {
    case 'single-choice':
      if (options.length === 0) return 0;
      const selectedOption = options.find(opt => opt.value === answer);
      if (!selectedOption) return 0;
      
      const minValue = Math.min(...options.map(opt => opt.value));
      const maxValue = Math.max(...options.map(opt => opt.value));
      
      if (minValue === maxValue) return 100;
      return ((answer - minValue) / (maxValue - minValue)) * 100;

    case 'multiple-choice':
      if (!Array.isArray(answer) || options.length === 0) return 0;
      
      // Calculate average of selected options
      const selectedValues = answer.map(val => {
        const opt = options.find(o => o.value === val);
        return opt ? opt.value : 0;
      });
      
      if (selectedValues.length === 0) return 0;
      
      const avgSelected = selectedValues.reduce((sum, val) => sum + val, 0) / selectedValues.length;
      const minVal = Math.min(...options.map(opt => opt.value));
      const maxVal = Math.max(...options.map(opt => opt.value));
      
      if (minVal === maxVal) return 100;
      return ((avgSelected - minVal) / (maxVal - minVal)) * 100;

    case 'scale':
      // Use scaleMin/scaleMax from question node, not options
      const scaleMin = questionNode?.scaleMin || 1;
      const scaleMax = questionNode?.scaleMax || 5;
      
      if (scaleMin === scaleMax) return 100;
      return ((answer - scaleMin) / (scaleMax - scaleMin)) * 100;

    case 'number':
      // For number inputs, use question node properties or options
      if (typeof answer !== 'number') return 0;
      
      const numMin = questionNode?.scaleMin || (options.length > 0 ? Math.min(...options.map(opt => opt.value)) : 0);
      const numMax = questionNode?.scaleMax || (options.length > 0 ? Math.max(...options.map(opt => opt.value)) : 100);
      
      if (numMin === numMax) return 100;
      const clampedAnswer = Math.max(numMin, Math.min(numMax, answer));
      return ((clampedAnswer - numMin) / (numMax - numMin)) * 100;

    case 'text':
      // Text answers excluded from analytics
      return 0;

    default:
      return 0;
  }
}

/**
 * Calculate domain score from answers with validation
 * @param {Array} answers - Array of FormAnswerV2 objects for this domain
 * @param {Array} questionNodes - Question nodes from questionnaire template
 * @returns {Object} Domain score calculation result
 */
function calculateDomainScore(answers, questionNodes) {
  if (!answers || answers.length === 0) {
    return {
      score: 0,
      maxScore: 100,
      answeredQuestions: 0,
      totalQuestions: questionNodes ? questionNodes.length : 0,
      details: []
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const details = [];

  answers.forEach(answer => {
    // Include all questions except text in calculation (remove graphable filter)
    if (answer.inputType === 'text') return; // Skip text questions only
    
    // Find corresponding question node for options and scale properties
    const questionNode = questionNodes?.find(q => q.id === answer.questionId);
    const options = questionNode?.options || [];
    
    // Normalize the answer with question node context
    const normalizedScore = normalizeAnswer(answer.answer, answer.inputType, options, questionNode);
    
    // Apply weight (default to 1 if missing)
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
      weightedScore: Math.round(weightedScore * 100) / 100
    });
  });

  if (totalWeight === 0) {
    return {
      score: 0,
      maxScore: 100,
      answeredQuestions: 0,
      totalQuestions: questionNodes ? questionNodes.filter(q => q.type === 'question' && q.inputType !== 'text').length : 0,
      details: []
    };
  }

  const finalScore = totalWeightedScore / totalWeight;

  return {
    score: Math.round(finalScore * 100) / 100,
    maxScore: 100,
    answeredQuestions: answers.filter(a => a.inputType !== 'text').length,
    totalQuestions: questionNodes ? questionNodes.filter(q => q.type === 'question' && q.inputType !== 'text').length : 0,
    totalWeight: totalWeight,
    details: details
  };
}

/**
 * Extract domain scores from form submission with proper hierarchy support
 * @param {Object} submission - FormSubmissionV2 object
 * @param {Array} questionnaireStructure - The questionnaire structure (FormNodeV2[])
 * @returns {Array} Array of domain scores
 */
function extractDomainScores(submission, questionnaireStructure) {
  if (!submission?.answers || !Array.isArray(questionnaireStructure)) {
    return [];
  }

  const domainScores = [];
  
  // Process each top-level domain
  questionnaireStructure.forEach(domainNode => {
    if (domainNode.type !== 'group') return;
    
    // Get all answers that belong to this domain (any level of nesting)
    const domainAnswers = submission.answers.filter(answer => {
      return Array.isArray(answer.nodePath) && 
             answer.nodePath.length > 0 && 
             answer.nodePath[0] === domainNode.id;
    });
    
    if (domainAnswers.length === 0) return;
    
    // Get all question nodes for this domain (recursively)
    const questionNodes = extractQuestionsFromNode(domainNode);
    
    // Calculate domain score
    const scoreData = calculateDomainScore(domainAnswers, questionNodes);
    
    domainScores.push({
      nodeId: domainNode.id,
      nodePath: [domainNode.id],
      title: domainNode.title || domainNode.id,
      score: scoreData.score,
      maxScore: scoreData.maxScore,
      answeredQuestions: scoreData.answeredQuestions,
      totalQuestions: scoreData.totalQuestions,
      totalWeight: scoreData.totalWeight,
      details: scoreData.details
    });
  });

  return domainScores;
}

/**
 * Recursively extract all question nodes from a tree node
 * @param {Object} node - FormNodeV2 object
 * @returns {Array} Array of question nodes
 */
function extractQuestionsFromNode(node) {
  if (!node) return [];
  
  const questions = [];
  
  if (node.type === 'question') {
    questions.push(node);
  }
  
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      questions.push(...extractQuestionsFromNode(child));
    });
  }
  
  // Also check option-specific children for choice questions
  if (node.options && Array.isArray(node.options)) {
    node.options.forEach(option => {
      if (option.children && option.children.length > 0) {
        option.children.forEach(child => {
          questions.push(...extractQuestionsFromNode(child));
        });
      }
    });
  }
  
  return questions;
}

/**
 * Calculate overall score for a submission
 * @param {Array} domainScores - Array of domain score objects
 * @returns {Object} Overall score calculation
 */
function calculateOverallScore(domainScores) {
  if (!domainScores || domainScores.length === 0) {
    return {
      totalScore: 0,
      maxScore: 100,
      averageScore: 0,
      domainCount: 0
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  domainScores.forEach(domain => {
    const weight = domain.totalWeight || 1;
    totalWeightedScore += domain.score * weight;
    totalWeight += weight;
  });

  const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  return {
    overallScore: Math.round(averageScore * 100) / 100,
    maxScore: 100,
    averageScore: Math.round(averageScore * 100) / 100,
    domainCount: domainScores.length,
    totalWeight: totalWeight
  };
}

module.exports = {
  normalizeAnswer,
  calculateDomainScore,
  extractDomainScores,
  extractQuestionsFromNode,
  calculateOverallScore
};

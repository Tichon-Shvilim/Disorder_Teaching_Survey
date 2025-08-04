// Utility functions for working with hierarchical questionnaire structure

/**
 * Recursively traverse form nodes to find all questions
 * @param {Array} nodes - Array of FormNode objects
 * @param {Array} parentPath - Path to current nodes (for building nodePath)
 * @returns {Array} Array of question objects with their paths
 */
function extractAllQuestions(nodes, parentPath = []) {
  const questions = [];
  
  for (const node of nodes) {
    const currentPath = [...parentPath, node.id];
    
    if (node.type === 'question') {
      questions.push({
        ...node,
        nodePath: currentPath
      });
    }
    
    // Recursively process children
    if (node.children && node.children.length > 0) {
      questions.push(...extractAllQuestions(node.children, currentPath));
    }
  }
  
  return questions;
}

/**
 * Find a specific node by ID in the tree structure
 * @param {Array} nodes - Array of FormNode objects to search
 * @param {String} nodeId - ID to find
 * @param {Array} parentPath - Current path (for building nodePath)
 * @returns {Object|null} Found node with its path or null
 */
function findNodeById(nodes, nodeId, parentPath = []) {
  for (const node of nodes) {
    const currentPath = [...parentPath, node.id];
    
    if (node.id === nodeId) {
      return {
        ...node,
        nodePath: currentPath
      };
    }
    
    // Search in children
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, nodeId, currentPath);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Validate tree structure for common issues
 * @param {Array} nodes - Array of FormNode objects
 * @param {Set} seenIds - Set to track duplicate IDs
 * @param {Array} parentPath - Current path for error reporting
 * @returns {Array} Array of validation errors
 */
function validateTreeStructure(nodes, seenIds = new Set(), parentPath = []) {
  const errors = [];
  
  for (const node of nodes) {
    const currentPath = [...parentPath, node.id || 'undefined'];
    
    // Check required fields
    if (!node.id) {
      errors.push(`Node at path ${currentPath.join('.')} missing required 'id' field`);
    }
    
    if (!node.type || !['group', 'question'].includes(node.type)) {
      errors.push(`Node ${node.id} at path ${currentPath.join('.')} has invalid type: ${node.type}`);
    }
    
    // Check for duplicate IDs
    if (node.id && seenIds.has(node.id)) {
      errors.push(`Duplicate node ID found: ${node.id} at path ${currentPath.join('.')}`);
    } else if (node.id) {
      seenIds.add(node.id);
    }
    
    // Validate question-specific fields
    if (node.type === 'question') {
      if (!node.inputType) {
        errors.push(`Question node ${node.id} missing required 'inputType' field`);
      }
      
      // Questions with choices must have options
      if (['single-choice', 'multiple-choice', 'scale'].includes(node.inputType)) {
        if (!node.options || node.options.length === 0) {
          errors.push(`Question node ${node.id} with inputType '${node.inputType}' must have options`);
        }
      }
    }
    
    // Validate group-specific rules
    if (node.type === 'group') {
      if (!node.title) {
        errors.push(`Group node ${node.id} should have a title`);
      }
    }
    
    // Validate children recursively
    if (node.children && node.children.length > 0) {
      errors.push(...validateTreeStructure(node.children, seenIds, currentPath));
    }
  }
  
  return errors;
}

/**
 * Generate node paths for all nodes in the tree
 * @param {Array} nodes - Array of FormNode objects
 * @param {Array} parentPath - Current path
 * @returns {Array} Array of {nodeId, nodePath} objects
 */
function generateNodePaths(nodes, parentPath = []) {
  const paths = [];
  
  for (const node of nodes) {
    const currentPath = [...parentPath, node.id];
    paths.push({
      nodeId: node.id,
      nodePath: currentPath,
      type: node.type
    });
    
    if (node.children && node.children.length > 0) {
      paths.push(...generateNodePaths(node.children, currentPath));
    }
  }
  
  return paths;
}

/**
 * Calculate maximum possible score for a questionnaire
 * @param {Array} nodes - Array of FormNode objects
 * @returns {Number} Maximum possible score
 */
function calculateMaxScore(nodes) {
  let maxScore = 0;
  const questions = extractAllQuestions(nodes);
  
  for (const question of questions) {
    if (question.graphable && question.options && question.options.length > 0) {
      // For choice questions, max score is highest option value * weight
      const maxOptionValue = Math.max(...question.options.map(opt => opt.value || 0));
      maxScore += maxOptionValue * (question.weight || 1);
    } else if (question.graphable && question.inputType === 'scale') {
      // For scale questions, assume max value is 5 (can be configured)
      maxScore += 5 * (question.weight || 1);
    } else if (question.graphable && question.inputType === 'number') {
      // For number questions, we can't assume max value - skip or use default
      maxScore += 10 * (question.weight || 1); // Default assumption
    }
  }
  
  return maxScore;
}

/**
 * Validate conditional logic in the tree
 * @param {Array} nodes - Array of FormNode objects
 * @returns {Array} Array of validation errors for conditions
 */
function validateConditionalLogic(nodes) {
  const errors = [];
  const allNodes = [];
  
  // First, collect all nodes with their paths
  function collectNodes(nodeArray, parentPath = []) {
    for (const node of nodeArray) {
      const currentPath = [...parentPath, node.id];
      allNodes.push({ ...node, nodePath: currentPath });
      
      if (node.children && node.children.length > 0) {
        collectNodes(node.children, currentPath);
      }
    }
  }
  
  collectNodes(nodes);
  
  // Validate conditions
  for (const node of allNodes) {
    if (node.condition && (node.condition.parentQuestionId || node.condition.parentOptionId)) {
      const { parentQuestionId, parentOptionId } = node.condition;
      
      // Find parent question
      const parentQuestion = allNodes.find(n => n.id === parentQuestionId && n.type === 'question');
      if (!parentQuestion) {
        errors.push(`Node ${node.id} references non-existent parent question: ${parentQuestionId}`);
        continue;
      }
      
      // Check if parent option exists
      if (parentOptionId) {
        const optionExists = parentQuestion.options && 
          parentQuestion.options.some(opt => opt.id === parentOptionId);
        if (!optionExists) {
          errors.push(`Node ${node.id} references non-existent parent option: ${parentOptionId} in question ${parentQuestionId}`);
        }
      }
    }
  }
  
  return errors;
}

module.exports = {
  extractAllQuestions,
  findNodeById,
  validateTreeStructure,
  generateNodePaths,
  calculateMaxScore,
  validateConditionalLogic
};

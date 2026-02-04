# Form Analytics Calculation Specification

## Overview
This document defines the correct methodology for calculating analytics from form submissions in a hierarchical questionnaire system with nested groups, weighted scores, and sub-questions.

## Core Principles

### 1. Score Normalization
All raw answers must be normalized to a **0-100 scale** where:
- **0** = Worst possible answer
- **100** = Best possible answer

### 2. Hierarchical Structure
Forms have a tree structure:
```
Domain (Group)
├── Sub-Domain (Group)
│   ├── Question 1
│   ├── Question 2
│   └── Sub-Question Group
│       ├── Sub-Question A
│       └── Sub-Question B
└── Question 3
```

### 3. Weight Application
Weights are applied at **question level** and propagated up through the hierarchy.

## Calculation Steps

### Step 1: Question-Level Normalization

#### Single-Choice Questions
```javascript
// Find min/max values from options
const minValue = Math.min(...options.map(opt => opt.value));
const maxValue = Math.max(...options.map(opt => opt.value));

// Normalize selected value
const normalizedScore = ((selectedValue - minValue) / (maxValue - minValue)) * 100;
```

#### Multiple-Choice Questions
```javascript
// Calculate average of selected option values
const selectedValues = selectedOptions.map(opt => opt.value);
const avgSelected = selectedValues.reduce((sum, val) => sum + val, 0) / selectedValues.length;

// Normalize using min/max from all available options
const normalizedScore = ((avgSelected - minValue) / (maxValue - minValue)) * 100;
```

#### Scale Questions
```javascript
// Use scaleMin/scaleMax from question definition
const normalizedScore = ((answer - scaleMin) / (scaleMax - scaleMin)) * 100;
```

#### Number Questions
```javascript
// Use predefined min/max or default range
const normalizedScore = ((answer - minValue) / (maxValue - minValue)) * 100;
```

#### Text Questions
```javascript
// Cannot be numerically scored - exclude from analytics
// OR assign neutral score of 50 if required
```

### Step 2: Weighted Question Scores
```javascript
const weightedScore = normalizedScore * questionWeight;
```

### Step 3: Group-Level Aggregation

#### For Each Group (Domain/Sub-Domain):
1. **Collect all child question scores** (including nested sub-questions)
2. **Sum weighted scores**: `totalWeightedScore = Σ(normalizedScore × weight)`
3. **Sum total weights**: `totalWeight = Σ(weight)`
4. **Calculate group score**: `groupScore = totalWeightedScore / totalWeight`

#### Recursive Calculation:
```javascript
function calculateGroupScore(groupNode, answers) {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  // Process direct child questions
  for (const child of groupNode.children) {
    if (child.type === 'question') {
      const answer = answers.find(a => a.questionId === child.id);
      if (answer && shouldIncludeInAnalytics(child)) {
        const normalizedScore = normalizeAnswer(answer, child);
        const weight = child.weight || 1;
        totalWeightedScore += normalizedScore * weight;
        totalWeight += weight;
      }
    } else if (child.type === 'group') {
      // Recursively calculate sub-group score
      const subGroupResult = calculateGroupScore(child, answers);
      const groupWeight = child.weight || 1;
      totalWeightedScore += subGroupResult.score * groupWeight;
      totalWeight += groupWeight;
    }
  }
  
  return {
    score: totalWeight > 0 ? totalWeightedScore / totalWeight : 0,
    totalWeight: totalWeight
  };
}
```

### Step 4: Overall Score Calculation
```javascript
// Weighted average of all top-level domain scores
let overallWeightedScore = 0;
let overallTotalWeight = 0;

for (const domain of domainScores) {
  const domainWeight = domain.totalWeight || 1;
  overallWeightedScore += domain.score * domainWeight;
  overallTotalWeight += domainWeight;
}

const overallScore = overallTotalWeight > 0 ? overallWeightedScore / overallTotalWeight : 0;
```

## Handling Special Cases

### Sub-Questions vs Sub-Domains

#### Sub-Questions (Option-Specific)
- **Triggered by**: Selecting specific options in parent questions
- **Calculation**: Included in parent question's domain
- **Weight**: Uses individual question weights
- **Example**: "If 'Yes' selected, show follow-up questions"

#### Sub-Domains (Structural Groups)
- **Always present**: Part of questionnaire structure
- **Calculation**: Separate domain with own score
- **Weight**: Uses group weight for aggregation
- **Example**: "Communication Skills" domain with sub-domains

### Nested Structure Handling

#### Scenario 1: Simple Hierarchy
```
Communication Domain (weight: 2)
├── Verbal Skills (weight: 1.5)
│   ├── Question 1 (weight: 1)
│   └── Question 2 (weight: 2)
└── Non-Verbal Skills (weight: 1)
    └── Question 3 (weight: 1)
```

**Calculation:**
1. Verbal Skills Score = (Q1_score × 1 + Q2_score × 2) / 3
2. Non-Verbal Skills Score = Q3_score × 1 / 1
3. Communication Score = (Verbal × 1.5 + NonVerbal × 1) / 2.5

#### Scenario 2: Option-Specific Sub-Questions
```
Question: "Communication Level" (weight: 2)
├── Option: "Non-verbal" → triggers sub-questions
│   ├── Sub-Q1: "Uses gestures" (weight: 1)
│   └── Sub-Q2: "Uses pictures" (weight: 1)
└── Option: "Verbal" → triggers different sub-questions
    └── Sub-Q3: "Sentence complexity" (weight: 1.5)
```

**Calculation:**
- If "Non-verbal" selected: Include Sub-Q1 and Sub-Q2 in domain
- If "Verbal" selected: Include Sub-Q3 in domain
- Main question score + triggered sub-question scores

## The Role of "Graphable"

### Current Understanding (Incorrect)
- Applied at **question level**
- Questions without `graphable: true` are **excluded** from analytics
- Causes entire questions to be skipped

### Correct Implementation
- **Groups/Domains**: `graphable` determines if domain appears in analytics dashboard
- **Questions**: ALL questions should contribute to their parent domain's score
- **UI Control**: `graphable` controls visualization, not calculation inclusion

### Recommended Approach
```javascript
// For calculation - include all questions
function shouldIncludeInCalculation(node) {
  return node.type === 'question' && node.inputType !== 'text';
}

// For display - respect graphable flag
function shouldShowInDashboard(node) {
  return node.graphable === true;
}
```

## Current Implementation Issues

### 1. **Critical Flaw: Graphable Filter**
```javascript
// WRONG - excludes questions from calculation
if (!answer.graphable) return;

// CORRECT - include all questions in calculation
if (node.type !== 'question') return;
```

### 2. **Scale Question Bug**
```javascript
// WRONG - scale questions don't have options array
const scaleMin = Math.min(...options.map(opt => opt.value));

// CORRECT - use question's scaleMin/scaleMax properties
const scaleMin = questionNode.scaleMin || 1;
const scaleMax = questionNode.scaleMax || 5;
```

### 3. **Inconsistent Score Format**
- **Backend**: Returns 0-100 scores
- **Frontend**: Expects 0-1 scores, multiplies by 100
- **Result**: Scores appear as 4400% instead of 44%

### 4. **Missing Nested Structure Support**
- Only processes first-level domains
- Ignores sub-domains and complex hierarchies
- Doesn't handle option-specific sub-questions properly

### 5. **Weight Handling Issues**
- Missing default weights (should be 1)
- Incorrect weight aggregation in nested structures
- No validation of weight values

## Required Fixes

### 1. **Remove Graphable Filter from Calculation**
```javascript
// Include all questions in calculation
answers.forEach(answer => {
  // Remove this line: if (!answer.graphable) return;
  
  const questionNode = findQuestionNode(answer.questionId);
  if (questionNode && questionNode.type === 'question') {
    // Process question
  }
});
```

### 2. **Fix Scale Question Normalization**
```javascript
case 'scale':
  const questionNode = questionNodes?.find(q => q.id === answer.questionId);
  const scaleMin = questionNode?.scaleMin || 1;
  const scaleMax = questionNode?.scaleMax || 5;
  
  if (scaleMin === scaleMax) return 100;
  return ((answer - scaleMin) / (scaleMax - scaleMin)) * 100;
```

### 3. **Standardize Score Format**
Use 0-100 throughout backend, divide by 100 only for percentage display:
```javascript
// Backend: Always return 0-100
return normalizedScore; // 0-100

// Frontend: Convert for display only
const displayPercentage = Math.round(score); // 44%
const displayDecimal = score / 100; // 0.44 for charts
```

### 4. **Implement Proper Hierarchy Processing**
```javascript
function extractAllDomains(structure, answers) {
  const domains = [];
  
  function processNode(node, path = []) {
    const currentPath = [...path, node.id];
    
    if (node.type === 'group') {
      // Calculate domain score including all nested content
      const domainScore = calculateDomainScore(node, answers, currentPath);
      domains.push(domainScore);
      
      // Process children for nested domains
      node.children?.forEach(child => processNode(child, currentPath));
    }
  }
  
  structure.forEach(node => processNode(node));
  return domains;
}
```

### 5. **Add Validation and Defaults**
```javascript
function validateAndNormalizeQuestion(question) {
  return {
    ...question,
    weight: question.weight || 1,
    graphable: question.graphable !== false, // Default to true
    required: question.required || false
  };
}
```

## Testing Strategy

### 1. **Create Test Questionnaire**
```json
{
  "structure": [
    {
      "id": "test_domain",
      "type": "group",
      "title": "Test Domain",
      "weight": 1,
      "graphable": true,
      "children": [
        {
          "id": "q1",
          "type": "question",
          "title": "Simple Question",
          "inputType": "single-choice",
          "weight": 1,
          "graphable": true,
          "options": [
            {"id": "opt1", "label": "Poor", "value": 1},
            {"id": "opt2", "label": "Good", "value": 5}
          ]
        }
      ]
    }
  ]
}
```

### 2. **Expected Results**
- Select "Poor" (value: 1) → Should get 0% (minimum)
- Select "Good" (value: 5) → Should get 100% (maximum)
- Domain score should match question score
- Overall score should match domain score

### 3. **Validation Steps**
1. Submit form with highest values → Should get ~100%
2. Submit form with lowest values → Should get ~0%
3. Submit form with mixed values → Should get proportional score
4. Verify nested domains calculate correctly
5. Verify weighted questions affect scores proportionally

## Implementation Priority

1. **HIGH**: Remove graphable filter from calculation logic
2. **HIGH**: Fix scale question normalization
3. **HIGH**: Standardize score format (0-100)
4. **MEDIUM**: Implement proper nested hierarchy support
5. **MEDIUM**: Add validation and default values
6. **LOW**: Optimize performance with question node lookup maps

This specification ensures accurate, consistent analytics calculation across all form structures while maintaining the flexibility of the hierarchical questionnaire system.
const mongoose = require('mongoose');

// Sub-question schema - full question structure for nested questions
const SubQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  domainId: { type: String, required: true }, // Reference to domain by ID within template
  type: { 
    type: String, 
    enum: ['single-choice', 'multiple-choice', 'text', 'number', 'scale'], 
    required: true 
  },
  options: [{ 
    id: String,
    value: Number,
    label: String,
    subQuestions: [this] // Recursive reference for nested sub-questions
  }],
  required: { type: Boolean, default: false },
  helpText: String,
  order: { type: Number, required: true },
  parentQuestionId: String,
  parentOptionId: String
}, { _id: false });

// Option schema with support for sub-questions
const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  value: { type: Number, required: true },
  label: { type: String, required: true },
  subQuestions: [SubQuestionSchema]
}, { _id: false });

// Main question schema
const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  domainId: { type: String, required: true }, // Reference to domain by ID within template
  type: { 
    type: String, 
    enum: ['single-choice', 'multiple-choice', 'text', 'number', 'scale'], 
    required: true 
  },
  options: [OptionSchema],
  required: { type: Boolean, default: false },
  helpText: String,
  order: { type: Number, required: true },
  parentQuestionId: String,
  parentOptionId: String
});

// Domain schema for questionnaire creation
const DomainDataSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Internal ID for referencing within template
  name: { type: String, required: true },
  description: String,
  color: String
}, { _id: false });

// Main questionnaire template schema
const QuestionnaireTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  domains: [DomainDataSchema],
  questions: [QuestionSchema],
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('QuestionnaireTemplate', QuestionnaireTemplateSchema);

const mongoose = require('mongoose');

// Option used in single-choice / multiple-choice / scale questions
const OptionSchema = new mongoose.Schema({
  id: String,
  label: String,
  value: Number
}, { _id: false });

// Recursive node structure: groups AND questions
const FormNodeSchema = new mongoose.Schema({
  id: { type: String, required: true }, // unique per node
  type: { 
    type: String, 
    enum: ['group', 'question'], 
    required: true 
  },

  title: String,
  description: String,
  weight: { type: Number, default: 1 },

  // For question nodes only
  inputType: { 
    type: String, 
    enum: ['single-choice', 'multiple-choice', 'scale', 'number', 'text'],
  },
  options: [OptionSchema], // Only for questions with choices or scale

  // Optional conditional logic: only show if parentOptionId is selected
  condition: {
    parentQuestionId: String,
    parentOptionId: String
  },

  // Graph display config (optional)
  graphable: { type: Boolean, default: false },
  preferredChartType: { 
    type: String, 
    enum: ['bar', 'line', 'radar', 'gauge', 'pie'], 
    default: 'bar' 
  },

  // Recursively define children
  children: [this]
}, { _id: false });

// Graph thresholds for colors and levels
const GraphSettingsSchema = new mongoose.Schema({
  colorRanges: [{
    label: String,    // e.g. "Low", "Medium", "High"
    min: Number,
    max: Number,
    color: String     // e.g. "red", "yellow", "green"
  }]
}, { _id: false });

// Full questionnaire template
const QuestionnaireTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  structure: [FormNodeSchema],     // Entry point: array of top-level domains/groups
  graphSettings: GraphSettingsSchema, // Threshold definitions
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuestionnaireTemplate', QuestionnaireTemplateSchema);

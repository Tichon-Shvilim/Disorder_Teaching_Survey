const mongoose = require('mongoose');

// Enhanced answer schema for hierarchical questionnaire responses
const AnswerV2Schema = new mongoose.Schema({
  questionId: { type: String, required: true }, // The FormNode ID of the question
  nodePath: [String], // Array representing path like ["comm", "spoken", "q1"] - helps with lookup and analytics
  inputType: { 
    type: String, 
    enum: ['single-choice', 'multiple-choice', 'scale', 'number', 'text'], 
    required: true 
  },
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Raw answer value
  selectedOptions: [{ // For choice-based questions
    id: String,
    label: String,
    value: Number
  }],
  // Optional metadata for analytics
  questionTitle: String, // Store question title for easier analytics
  weight: { type: Number, default: 1 }, // Question weight for scoring
  graphable: { type: Boolean, default: false }, // Whether this answer should be included in graphs
}, { _id: false });

// Enhanced form submission schema for V2 questionnaires
const FormSubmissionV2Schema = new mongoose.Schema({
  // Student information (string reference to student-service)
  studentId: { type: String, required: true }, // Reference to Student in student-service
  studentName: { type: String, required: true }, // Denormalized for performance
  
  // Questionnaire information (local reference)
  questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionnaireTemplateV2', required: true },
  questionnaireTitle: { type: String, required: true }, // Denormalized for performance
  
  // Enhanced submission data
  answers: [AnswerV2Schema],
  submittedAt: { type: Date, default: Date.now },
  completedBy: { type: String }, // User ID who filled it (therapist, teacher, etc.)
  
  // Metadata
  status: { 
    type: String, 
    enum: ['draft', 'completed', 'reviewed'], 
    default: 'completed' 
  },
  notes: { type: String },
  
  // Analytics fields - will be populated by analytics-service later
  // Keeping them optional for now
  totalScore: { type: Number, default: null },
  domainScores: [{ // Scores per domain/group
    nodeId: String,
    nodePath: [String],
    title: String,
    score: Number,
    maxScore: Number
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
FormSubmissionV2Schema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
FormSubmissionV2Schema.index({ studentId: 1, submittedAt: -1 });
FormSubmissionV2Schema.index({ questionnaireId: 1 });
FormSubmissionV2Schema.index({ 'answers.nodePath': 1 }); // For analytics queries

module.exports = mongoose.model('FormSubmissionV2', FormSubmissionV2Schema);

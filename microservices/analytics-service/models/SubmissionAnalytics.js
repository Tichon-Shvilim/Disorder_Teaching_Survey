const mongoose = require('mongoose');

// Schema for individual domain scores
const DomainScoreSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  nodePath: [String],
  title: { type: String, required: true },
  score: { type: Number, required: true }, // 0-100 normalized score
  maxScore: { type: Number, default: 100 },
  answeredQuestions: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  totalWeight: { type: Number, default: 0 },
  details: [{
    questionId: String,
    questionTitle: String,
    rawAnswer: mongoose.Schema.Types.Mixed,
    normalizedScore: Number,
    weight: Number,
    weightedScore: Number
  }]
}, { _id: false });

// Schema for overall submission analytics
const SubmissionAnalyticsSchema = new mongoose.Schema({
  // Reference data
  submissionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FormSubmissionV2', 
    required: true,
    unique: true // One analytics record per submission
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  questionnaireId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'QuestionnaireTemplateV2', 
    required: true 
  },
  
  // Denormalized data for performance
  studentName: { type: String, required: true },
  questionnaireTitle: { type: String, required: true },
  submittedAt: { type: Date, required: true },
  
  // Calculated scores
  overallScore: { type: Number, required: true }, // 0-100 overall score
  domainScores: [DomainScoreSchema],
  
  // Metadata
  calculatedAt: { type: Date, default: Date.now },
  isValid: { type: Boolean, default: true }, // False if needs recalculation
  version: { type: Number, default: 1 } // For handling calculation updates
}, {
  timestamps: true
});

// Indexes for performance
SubmissionAnalyticsSchema.index({ studentId: 1, submittedAt: -1 });
SubmissionAnalyticsSchema.index({ questionnaireId: 1 });
SubmissionAnalyticsSchema.index({ submissionId: 1 });
SubmissionAnalyticsSchema.index({ 'domainScores.nodeId': 1 });

module.exports = mongoose.model('SubmissionAnalytics', SubmissionAnalyticsSchema);

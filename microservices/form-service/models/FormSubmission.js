const mongoose = require('mongoose');

// Answer schema for individual question responses
const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  questionType: { 
    type: String, 
    enum: ['single-choice', 'multiple-choice', 'text', 'number', 'scale'], 
    required: true 
  },
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, number, array
  selectedOptions: [{ // For choice questions
    id: String,
    label: String,
    value: Number
  }]
}, { _id: false });

// Main form submission schema
const FormSubmissionSchema = new mongoose.Schema({
  // Student information
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  
  // Questionnaire information
  questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionnaireTemplate', required: true },
  questionnaireTitle: { type: String, required: true },
  
  // Submission data
  answers: [AnswerSchema],
  submittedAt: { type: Date, default: Date.now },
  completedBy: { type: String }, // Who filled it (therapist, teacher, etc.) - name for display
  completedById: { type: String }, // User ID of who filled it - for robust identification
  
  // Metadata
  status: { 
    type: String, 
    enum: ['draft', 'completed', 'reviewed'], 
    default: 'completed' 
  },
  notes: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
FormSubmissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
FormSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
FormSubmissionSchema.index({ questionnaireId: 1 });

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);

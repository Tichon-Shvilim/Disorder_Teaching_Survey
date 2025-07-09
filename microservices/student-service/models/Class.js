const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  classNumber: { 
    type: String, 
    required: true,
    unique: true // Ensure each class number is unique
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming teachers are stored in User collection
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, {
  timestamps: true
});

// Index for better performance
ClassSchema.index({ classNumber: 1 });

module.exports = mongoose.model('Class', ClassSchema);
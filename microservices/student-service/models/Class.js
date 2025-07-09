const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  grade: { 
    type: String, 
    required: true
  },
  classNumber: { 
    type: Number, 
    required: true
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
ClassSchema.index({ grade: 1, classNumber: 1 });

module.exports = mongoose.model('Class', ClassSchema);
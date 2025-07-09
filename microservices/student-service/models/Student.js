const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  DOB: { type: Date, required: true },
  classNumber: { 
    type: String, 
    required: false // Optional field in case some students aren't assigned to a class yet
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', StudentSchema);
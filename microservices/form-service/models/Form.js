const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  assessment: { type: String, required: true },
  score: { type: Number, required: true }
});

module.exports = mongoose.model('Form', FormSchema);
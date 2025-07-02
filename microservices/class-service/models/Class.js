const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId }], // IDs from teacher-service
  studentIds: [{ type: mongoose.Schema.Types.ObjectId }], // IDs from student-service
});

module.exports = mongoose.model('Class', ClassSchema);
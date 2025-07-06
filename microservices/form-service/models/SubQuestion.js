const mongoose = require('mongoose');

const SubQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true }, // נוסח תת-השאלה
  options: [{
    value: { type: Number, required: true },
    label: { type: String, required: true }
  }]
});

module.exports = mongoose.model('SubQuestion', SubQuestionSchema);
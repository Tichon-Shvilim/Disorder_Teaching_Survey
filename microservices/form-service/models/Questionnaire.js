const mongoose = require('mongoose');

// תשובה לשאלה רגילה או תת-שאלה
const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  value: { type: Number, required: true }, // הערך שנבחר (למשל 1-5)
  // אם יש תתי-שאלות, שמור כאן את התשובות שלהן
  subAnswers: [{
    subQuestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubQuestion', required: true },
    value: { type: Number, required: true }
  }]
}, { _id: false });

const FormSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: Date, default: Date.now },
  answers: { type: [AnswerSchema], required: true }
});

module.exports = mongoose.model('Form', FormSchema);
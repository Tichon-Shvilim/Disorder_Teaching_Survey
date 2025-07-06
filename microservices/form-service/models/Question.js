const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  value: { type: Number, required: true }, // לדוג' 1-5
  label: { type: String, required: true }, // תיאור מילולי של האופציה
  subQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubQuestion' }] // תתי-שאלות לאופציה זו
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true }, // נוסח השאלה
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true }, // הפניה לתחום
  options: { type: [OptionSchema], required: true } // מערך אופציות
});

module.exports = mongoose.model('Question', QuestionSchema);


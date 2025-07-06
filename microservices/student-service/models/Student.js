const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  DOB: { type: Date, required: true },

});

module.exports = mongoose.model('Student', StudentSchema);
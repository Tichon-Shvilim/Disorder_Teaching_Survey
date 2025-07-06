const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // שם התחום (למשל "תקשורת מילולית")
  });

module.exports = mongoose.model('Domain', DomainSchema);
const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: Object } // Additional details about the action
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
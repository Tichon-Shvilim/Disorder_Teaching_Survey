const express = require('express');
const Analytics = require('../models/Analytics');
const router = express.Router();

// Log a new action
router.post('/log', async (req, res) => {
  const analytics = new Analytics(req.body);
  await analytics.save();
  res.status(201).send(analytics);
});

// Get analytics data
router.get('/', async (req, res) => {
  const analyticsData = await Analytics.find().populate('userId');
  res.send(analyticsData);
});

module.exports = router;
const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).send(user);
});

// Get all users
router.get('/', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

module.exports = router;

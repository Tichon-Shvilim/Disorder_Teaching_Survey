const express = require('express');
const Form = require('../models/Form');
const router = express.Router();

// Submit a new form
router.post('/', async (req, res) => {
  const form = new Form(req.body);
  await form.save();
  res.status(201).send(form);
});

// Get all forms
router.get('/', async (req, res) => {
  const forms = await Form.find().populate('studentId');
  res.send(forms);
});

module.exports = router;

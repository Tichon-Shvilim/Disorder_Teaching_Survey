const express = require('express');
const Form = require('../models/Questionnaire');
const router = express.Router();

// Create new form (questionnaire)
router.post('/', async (req, res) => {
  const form = new Form(req.body);
  await form.save();
  res.status(201).send(form);
});

// Get all forms
router.get('/', async (req, res) => {
  const forms = await Form.find().populate('studentId teacherId');
  res.send(forms);
});

// Get form by id
router.get('/:id', async (req, res) => {
  const form = await Form.findById(req.params.id).populate('studentId teacherId');
  if (!form) return res.status(404).send({ message: 'Form not found' });
  res.send(form);
});

// Update form (for drafts, etc.)
router.put('/:id', async (req, res) => {
  const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!form) return res.status(404).send({ message: 'Form not found' });
  res.send(form);
});

// Delete form
router.delete('/:id', async (req, res) => {
  const form = await Form.findByIdAndDelete(req.params.id);
  if (!form) return res.status(404).send({ message: 'Form not found' });
  res.send({ message: 'Form deleted', form });
});

module.exports = router;
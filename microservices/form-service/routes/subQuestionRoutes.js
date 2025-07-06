const express = require('express');
const SubQuestion = require('../models/SubQuestion');
const router = express.Router();

// Create sub-question
router.post('/', async (req, res) => {
  const subQuestion = new SubQuestion(req.body);
  await subQuestion.save();
  res.status(201).send(subQuestion);
});

// Get all sub-questions
router.get('/', async (req, res) => {
  const subQuestions = await SubQuestion.find();
  res.send(subQuestions);
});

// Get sub-question by id
router.get('/:id', async (req, res) => {
  const subQuestion = await SubQuestion.findById(req.params.id);
  if (!subQuestion) return res.status(404).send({ message: 'SubQuestion not found' });
  res.send(subQuestion);
});

// Update sub-question
router.put('/:id', async (req, res) => {
  const subQuestion = await SubQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subQuestion) return res.status(404).send({ message: 'SubQuestion not found' });
  res.send(subQuestion);
});

// Delete sub-question
router.delete('/:id', async (req, res) => {
  const subQuestion = await SubQuestion.findByIdAndDelete(req.params.id);
  if (!subQuestion) return res.status(404).send({ message: 'SubQuestion not found' });
  res.send({ message: 'SubQuestion deleted', subQuestion });
});

module.exports = router;
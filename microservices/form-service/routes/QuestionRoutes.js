const express = require('express');
const Question = require('../models/Question');
const router = express.Router();

// Create question
router.post('/', async (req, res) => {
  const question = new Question(req.body);
  await question.save();
  res.status(201).send(question);
});

// Get all questions (optionally by domain)
router.get('/', async (req, res) => {
  const filter = req.query.domainId ? { domainId: req.query.domainId } : {};
  const questions = await Question.find(filter);
  res.send(questions);
});

// Get question by id
router.get('/:id', async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).send({ message: 'Question not found' });
  res.send(question);
});

// Update question
router.put('/:id', async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!question) return res.status(404).send({ message: 'Question not found' });
  res.send(question);
});

// Delete question
router.delete('/:id', async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).send({ message: 'Question not found' });
  res.send({ message: 'Question deleted', question });
});

module.exports = router;
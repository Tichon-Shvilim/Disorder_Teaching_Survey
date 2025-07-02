const express = require('express');
const Class = require('../models/Class');
const router = express.Router();

// Create a new class
router.post('/', async (req, res) => {
  const newClass = new Class(req.body);
  await newClass.save();
  res.status(201).send(newClass);
});

// Get all classes
router.get('/', async (req, res) => {
  const classes = await Class.find();
  res.send(classes);
});

// Get a class by ID
router.get('/:id', async (req, res) => {
  const classObj = await Class.findById(req.params.id);
  if (!classObj) return res.status(404).send({ message: 'Class not found' });
  res.send(classObj);
});

// Update a class
router.put('/:id', async (req, res) => {
  const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).send({ message: 'Class not found' });
  res.send(updated);
});

// Delete a class
router.delete('/:id', async (req, res) => {
  const deleted = await Class.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).send({ message: 'Class not found' });
  res.send({ message: 'Class deleted', deleted });
});

module.exports = router;
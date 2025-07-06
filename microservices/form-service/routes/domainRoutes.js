const express = require('express');
const Domain = require('../models/Domain');
const router = express.Router();

// Create domain
router.post('/', async (req, res) => {
  const domain = new Domain(req.body);
  await domain.save();
  res.status(201).send(domain);
});

// Get all domains
router.get('/', async (req, res) => {
  const domains = await Domain.find();
  res.send(domains);
});

// Get domain by id
router.get('/:id', async (req, res) => {
  const domain = await Domain.findById(req.params.id);
  if (!domain) return res.status(404).send({ message: 'Domain not found' });
  res.send(domain);
});

// Update domain
router.put('/:id', async (req, res) => {
  const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!domain) return res.status(404).send({ message: 'Domain not found' });
  res.send(domain);
});

// Delete domain
router.delete('/:id', async (req, res) => {
  const domain = await Domain.findByIdAndDelete(req.params.id);
  if (!domain) return res.status(404).send({ message: 'Domain not found' });
  res.send({ message: 'Domain deleted', domain });
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Register all routes
app.use('/api/questionnaires', require('./routes/QuestionnaireTemplateRoutes'));
app.use('/api/questionnaires', require('./routes/QuestionnaireTemplateV2Routes')); // V2 Enhanced routes
app.use('/api/forms', require('./routes/FormSubmissionRoutes'));

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Form Service running on port ${PORT}`);
});
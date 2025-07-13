const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Register all routes
//app.use('/api/forms', require('./routes/formRoutes'));
app.use('/api/domains', require('./routes/domainRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/subquestions', require('./routes/subQuestionRoutes'));
app.use('/api/questionnaires', require('./routes/QuestionnaireRoutes'));

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Form Service running on port ${PORT}`);
});
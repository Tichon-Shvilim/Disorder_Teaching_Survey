const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/domains', require('./routes/domainRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/subquestions', require('./routes/subQuestionRoutes'));
app.use('/api/forms', require('./routes/Questionnaire'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Form Service running on port ${PORT}`);
});
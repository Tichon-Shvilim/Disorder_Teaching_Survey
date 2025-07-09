const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <-- ADD THIS LINE
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: 'http://localhost:5173', // Allow your frontend origin
  credentials: true,
}));

app.use(express.json());
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Student Service running on port ${PORT}`);
});
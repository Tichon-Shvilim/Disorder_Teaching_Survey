const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/classes', require('./routes/ClassRoutes'));

app.listen(PORT, () => {
  console.log(`Class Service running on port ${PORT}`);
});
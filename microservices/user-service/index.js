const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/users', require('./routes/userRoutes'));

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

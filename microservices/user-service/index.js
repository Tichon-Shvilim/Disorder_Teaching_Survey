const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true, // Allow cookies and credentials
}));

app.use(express.json());
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/users', require('./routes/userRoutes'));

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

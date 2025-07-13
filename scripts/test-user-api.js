const fetch = require('node-fetch');

// Test script to verify user API is working
async function testUserAPI() {
  const baseURL = 'http://localhost:3001/api/users';
  
  try {
    console.log('Testing GET /api/users...');
    
    // First try to fetch users without authentication to see the error
    const response = await fetch(baseURL);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('Response body:', data);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testUserAPI();

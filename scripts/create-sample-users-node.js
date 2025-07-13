const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Sample users with assignments
const sampleUsers = [
  {
    name: "Dr. Sarah Wilson",
    email: "sarah.wilson@school.com",
    password: "password123",
    role: "admin",
    status: "active"
  },
  {
    name: "Ms. Emily Johnson",
    email: "emily.johnson@school.com", 
    password: "password123",
    role: "teacher",
    status: "active",
    classes: [
      {
        _id: "507f1f77bcf86cd799439011", // Valid ObjectId format
        classNumber: "5A"
      },
      {
        _id: "507f1f77bcf86cd799439012",
        classNumber: "6B"
      },
      {
        _id: "507f1f77bcf86cd799439013",
        classNumber: "7C"
      }
    ]
  },
  {
    name: "Mr. Robert Smith",
    email: "robert.smith@school.com",
    password: "password123", 
    role: "teacher",
    status: "active",
    classes: [
      {
        _id: "507f1f77bcf86cd799439014",
        classNumber: "Math 101"
      }
    ]
  },
  {
    name: "Ms. Jennifer Davis",
    email: "jennifer.davis@school.com",
    password: "password123",
    role: "therapist", 
    status: "active",
    students: [
      {
        _id: "507f1f77bcf86cd799439015",
        name: "Emma Johnson"
      },
      {
        _id: "507f1f77bcf86cd799439016", 
        name: "Sarah Williams"
      },
      {
        _id: "507f1f77bcf86cd799439017", 
        name: "Alex Thompson"
      },
      {
        _id: "507f1f77bcf86cd799439018", 
        name: "Maria Garcia"
      }
    ]
  },
  {
    name: "Dr. Michael Brown",
    email: "michael.brown@school.com",
    password: "password123",
    role: "therapist",
    status: "inactive",
    students: []
  }
];

async function createSampleUsers() {
  console.log('Creating sample users...');
  
  for (const user of sampleUsers) {
    try {
      const response = await axios.post(`${BASE_URL}/api/users/register`, user);
      console.log(`✓ Created user: ${user.name} (${user.role})`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('duplicate')) {
        console.log(`- User already exists: ${user.name}`);
      } else {
        console.error(`✗ Failed to create user ${user.name}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log('Sample user creation completed!');
}

// Check if user service is running
async function checkUserService() {
  try {
    await axios.get(`${BASE_URL}/healthz`);
    console.log('✓ User service is running');
    return true;
  } catch (error) {
    console.error('✗ User service is not running. Please start it first.');
    return false;
  }
}

async function main() {
  const serviceRunning = await checkUserService();
  if (serviceRunning) {
    await createSampleUsers();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createSampleUsers, sampleUsers };

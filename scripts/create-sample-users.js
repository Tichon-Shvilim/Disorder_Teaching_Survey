// Sample script to create users with assignments for testing
// Run this in your MongoDB shell or through Node.js

const sampleUsers = [
  {
    name: "Dr. Sarah Wilson",
    email: "sarah.wilson@school.com",
    password: "password123", // This should be hashed in production
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
        _id: "60f1b2b5d4f8c12345678901", // Sample ObjectId
        classNumber: "5A"
      },
      {
        _id: "60f1b2b5d4f8c12345678902",
        classNumber: "6B"
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
        _id: "60f1b2b5d4f8c12345678903",
        classNumber: "Mathematics"
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
        _id: "60f1b2b5d4f8c12345678904",
        name: "Emma Johnson"
      },
      {
        _id: "60f1b2b5d4f8c12345678905", 
        name: "Sarah Williams"
      }
    ]
  },
  {
    name: "Dr. Michael Brown",
    email: "michael.brown@school.com",
    password: "password123",
    role: "therapist",
    status: "inactive", // Inactive user example
    students: []
  }
];

// Instructions for use:
// 1. Make sure your user-service is running
// 2. Use a tool like Postman or curl to POST each user to /api/users/register
// 3. Or modify this to be a Node.js script that makes HTTP requests

console.log("Sample Users Data:");
console.log(JSON.stringify(sampleUsers, null, 2));

// Example curl commands:
const curlCommands = sampleUsers.map((user, index) => {
  return `curl -X POST http://localhost:3001/api/users/register \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(user)}'`;
});

console.log("\nCurl commands to create users:");
curlCommands.forEach((cmd, index) => {
  console.log(`\n# User ${index + 1}:`);
  console.log(cmd);
});

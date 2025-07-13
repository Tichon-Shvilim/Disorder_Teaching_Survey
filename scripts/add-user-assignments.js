const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/users';

// Function to add assignments to existing users
async function addAssignmentsToUsers() {
  try {
    console.log('Fetching existing users...');
    
    // Get all users first
    const usersResponse = await axios.get(BASE_URL);
    const users = usersResponse.data;
    
    console.log(`Found ${users.length} users`);
    
    // Add assignments to each user based on their role
    for (const user of users) {
      const updates = {};
      
      if (user.role.toLowerCase() === 'teacher') {
        updates.classes = [
          { _id: "507f1f77bcf86cd799439011", classNumber: "5A" },
          { _id: "507f1f77bcf86cd799439012", classNumber: "6B" },
          { _id: "507f1f77bcf86cd799439013", classNumber: "Math 101" },
          { _id: "507f1f77bcf86cd799439014", classNumber: "Science 202" }
        ];
        console.log(`Adding ${updates.classes.length} classes to teacher: ${user.name}`);
      } else if (user.role.toLowerCase() === 'therapist') {
        updates.students = [
          { _id: "507f1f77bcf86cd799439015", name: "Emma Johnson" },
          { _id: "507f1f77bcf86cd799439016", name: "Sarah Williams" },
          { _id: "507f1f77bcf86cd799439017", name: "Alex Thompson" },
          { _id: "507f1f77bcf86cd799439018", name: "Maria Garcia" }
        ];
        console.log(`Adding ${updates.students.length} students to therapist: ${user.name}`);
      }
      
      // Update user if there are assignments to add
      if (Object.keys(updates).length > 0) {
        try {
          const updateResponse = await axios.put(`${BASE_URL}/${user._id}`, {
            ...user,
            ...updates
          });
          console.log(`✓ Updated ${user.name} with assignments`);
        } catch (error) {
          console.error(`✗ Failed to update ${user.name}:`, error.response?.data || error.message);
        }
      }
    }
    
    console.log('Assignment update completed!');
    
  } catch (error) {
    console.error('Error updating user assignments:', error.response?.data || error.message);
  }
}

// Function to verify the assignments were added
async function verifyAssignments() {
  try {
    console.log('\nVerifying assignments...');
    const usersResponse = await axios.get(BASE_URL);
    const users = usersResponse.data;
    
    users.forEach(user => {
      if (user.role.toLowerCase() === 'teacher' && user.classes) {
        console.log(`Teacher ${user.name}: ${user.classes.length} classes assigned`);
        user.classes.forEach(cls => console.log(`  - Class ${cls.classNumber}`));
      } else if (user.role.toLowerCase() === 'therapist' && user.students) {
        console.log(`Therapist ${user.name}: ${user.students.length} students assigned`);
        user.students.forEach(student => console.log(`  - ${student.name}`));
      } else if (user.role.toLowerCase() === 'admin') {
        console.log(`Admin ${user.name}: No assignments needed`);
      }
    });
    
  } catch (error) {
    console.error('Error verifying assignments:', error.response?.data || error.message);
  }
}

async function main() {
  await addAssignmentsToUsers();
  await verifyAssignments();
}

if (require.main === module) {
  main();
}

module.exports = { addAssignmentsToUsers, verifyAssignments };

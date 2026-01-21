// Script to create or reset admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/userDB';

// Admin credentials - CHANGE THESE
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'System Admin';

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
});

const User = mongoose.model('User', userSchema);

async function createOrUpdateAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      // Update existing admin password
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'Admin';
      existingAdmin.name = ADMIN_NAME;
      await existingAdmin.save();
      console.log(`✅ Admin user updated successfully!`);
    } else {
      // Create new admin user
      const admin = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'Admin',
        assignedClasses: [],
        assignedStudents: [],
      });
      await admin.save();
      console.log(`✅ Admin user created successfully!`);
    }

    console.log(`\n📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`\nYou can now login with these credentials.`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createOrUpdateAdmin();

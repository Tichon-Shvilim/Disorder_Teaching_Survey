const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Student Schema
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  DOB: { type: Date, required: true },
  classId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false
  },
  therapists: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String
  }]
}, {
  timestamps: true
});

// Correct Class Schema
const ClassSchema = new mongoose.Schema({
  classNumber: { 
    type: String, 
    required: true,
    unique: true
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, {
  timestamps: true
});

const Student = mongoose.model('Student', StudentSchema);
const Class = mongoose.model('Class', ClassSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/studentDB';

async function fixClassSchema() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully');

    console.log('🔍 Looking for ב2 class...');
    
    // Find the ב2 class
    const className = 'ב2';
    const classToFix = await Class.findOne({ classNumber: className });
    
    if (!classToFix) {
      console.log(`❌ Class "${className}" not found!`);
      return;
    }

    console.log(`✓ Found class "${className}"`);
    console.log(`Current students array:`, classToFix.students);

    // Get all students that should be in this class
    const studentsInClass = await Student.find({ classId: classToFix._id });
    console.log(`🔍 Found ${studentsInClass.length} students assigned to this class`);

    // Update the class to have correct schema - just student IDs
    const studentIds = studentsInClass.map(student => student._id);
    
    classToFix.students = studentIds;
    await classToFix.save();

    console.log(`✓ Fixed class "${className}" schema`);
    console.log(`✓ Updated students array with ${studentIds.length} student IDs`);

    // Verify by fetching the class with populated students
    const verifyClass = await Class.findOne({ classNumber: className })
      .populate('students', 'name DOB');
    
    console.log(`\n📊 Verification:`);
    console.log(`Class: ${verifyClass.classNumber}`);
    console.log(`Students: ${verifyClass.students.length}`);
    verifyClass.students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (${new Date(student.DOB).toLocaleDateString()})`);
    });

    console.log('\n🎉 Class schema fix completed successfully!');

  } catch (error) {
    console.error('💥 Fix failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixClassSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Student Schema (copy from the model)
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

// Class Schema (copy from the model)
const ClassSchema = new mongoose.Schema({
  classNumber: { type: String, required: true, unique: true },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  students: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    name: String,
    DOB: Date,
    classNumber: String
  }]
}, {
  timestamps: true
});

const Student = mongoose.model('Student', StudentSchema);
const Class = mongoose.model('Class', ClassSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/studentDB';
const OLD_CLASS_NAME = process.argv[2] || 'Unassigned';
const NEW_CLASS_NAME = process.argv[3] || 'ב2';

async function renameClass() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully');

    console.log(`🔍 Looking for class "${OLD_CLASS_NAME}"...`);
    
    // Find the class to rename
    const classToRename = await Class.findOne({ classNumber: OLD_CLASS_NAME });
    
    if (!classToRename) {
      console.log(`❌ Class "${OLD_CLASS_NAME}" not found!`);
      return;
    }

    console.log(`✓ Found class "${OLD_CLASS_NAME}" with ${classToRename.students.length} students`);

    // Check if new class name already exists
    const existingClass = await Class.findOne({ classNumber: NEW_CLASS_NAME });
    if (existingClass) {
      console.log(`❌ Class "${NEW_CLASS_NAME}" already exists! Cannot rename.`);
      return;
    }

    console.log(`🚀 Renaming class from "${OLD_CLASS_NAME}" to "${NEW_CLASS_NAME}"...`);

    // Update the class name
    classToRename.classNumber = NEW_CLASS_NAME;
    
    // Update the classNumber in all students within this class
    classToRename.students = classToRename.students.map(student => ({
      ...student,
      classNumber: NEW_CLASS_NAME
    }));

    await classToRename.save();

    console.log(`✓ Successfully renamed class to "${NEW_CLASS_NAME}"`);
    console.log(`✓ Updated ${classToRename.students.length} student records in the class`);

    console.log('\n🎉 Class rename completed successfully!');

  } catch (error) {
    console.error('💥 Rename failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
renameClass()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

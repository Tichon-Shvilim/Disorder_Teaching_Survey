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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disorder_teaching_survey';
const DEFAULT_CLASS_NAME = 'Unassigned'; // Default class name

async function createDefaultClass() {
  try {
    // Check if default class already exists
    let defaultClass = await Class.findOne({ classNumber: DEFAULT_CLASS_NAME });
    
    if (!defaultClass) {
      console.log(`Creating default class "${DEFAULT_CLASS_NAME}"...`);
      defaultClass = new Class({
        classNumber: DEFAULT_CLASS_NAME,
        teachers: [],
        students: []
      });
      await defaultClass.save();
      console.log('✓ Default class created successfully');
    } else {
      console.log(`✓ Default class "${DEFAULT_CLASS_NAME}" already exists`);
    }
    
    return defaultClass;
  } catch (error) {
    console.error('Error creating default class:', error);
    throw error;
  }
}

async function migrateStudentsToDefaultClass() {
  try {
    console.log('🔍 Searching for students without class assignment...');
    
    // Find students without classId (null, undefined, or empty)
    const studentsWithoutClass = await Student.find({
      $or: [
        { classId: null },
        { classId: { $exists: false } },
        { classId: '' }
      ]
    });

    console.log(`📊 Found ${studentsWithoutClass.length} students without class assignment`);

    if (studentsWithoutClass.length === 0) {
      console.log('✅ All students already have class assignments!');
      return;
    }

    // Create or get default class
    const defaultClass = await createDefaultClass();

    console.log('\n📝 Students to be migrated:');
    studentsWithoutClass.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (ID: ${student._id})`);
    });

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`\n❓ Do you want to assign these ${studentsWithoutClass.length} students to class "${DEFAULT_CLASS_NAME}"? (y/N): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled by user');
      return;
    }

    console.log('\n🚀 Starting migration...');

    let successCount = 0;
    let errorCount = 0;

    // Update students one by one
    for (const student of studentsWithoutClass) {
      try {
        // Update student's classId
        await Student.findByIdAndUpdate(student._id, {
          classId: defaultClass._id
        });

        // Add student to the default class's students array (if not already there)
        const studentInClass = defaultClass.students.find(s => s._id.toString() === student._id.toString());
        if (!studentInClass) {
          defaultClass.students.push({
            _id: student._id,
            name: student.name,
            DOB: student.DOB,
            classNumber: DEFAULT_CLASS_NAME
          });
        }

        successCount++;
        console.log(`✓ Migrated: ${student.name}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate ${student.name}:`, error.message);
      }
    }

    // Save the updated default class
    if (successCount > 0) {
      await defaultClass.save();
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✓ Successfully migrated: ${successCount} students`);
    console.log(`  ✗ Failed migrations: ${errorCount} students`);
    console.log(`  📚 Default class "${DEFAULT_CLASS_NAME}" now has ${defaultClass.students.length} students`);

    if (successCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log(`ℹ️  All migrated students are now assigned to class "${DEFAULT_CLASS_NAME}"`);
      console.log('ℹ️  You can later reassign them to appropriate classes through the UI');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully');

    console.log('\n🎯 Starting Student Class Migration Script');
    console.log('=' .repeat(50));

    await migrateStudentsToDefaultClass();

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted by user');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main();

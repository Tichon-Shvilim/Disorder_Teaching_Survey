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

// Class Schema (copy from the actual model)
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
const DEFAULT_CLASS_NAME = process.argv[2] || 'ב2'; // Allow custom class name via command line

async function autoMigrateStudents() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully');

    console.log('🔍 Searching for students without class assignment...');
    
    // Find students without classId using native MongoDB query
    const studentsWithoutClass = await Student.collection.find({
      $or: [
        { classId: null },
        { classId: { $exists: false } },
        { classId: "" }
      ]
    }).toArray();

    console.log(`📊 Found ${studentsWithoutClass.length} students without class assignment`);

    if (studentsWithoutClass.length === 0) {
      console.log('✅ All students already have class assignments!');
      return;
    }

    // Create or get default class
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
      console.log(`✓ Using existing class "${DEFAULT_CLASS_NAME}"`);
    }

    console.log('🚀 Starting automatic migration...');

    let successCount = 0;
    let errorCount = 0;

    // Update students in batch
    for (const student of studentsWithoutClass) {
      try {
        // Update student's classId
        await Student.findByIdAndUpdate(student._id, {
          classId: defaultClass._id
        });

        // Add student to the default class's students array (if not already there)
        const studentInClass = defaultClass.students.find(s => s.toString() === student._id.toString());
        if (!studentInClass) {
          defaultClass.students.push(student._id);
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
    console.log(`  📚 Class "${DEFAULT_CLASS_NAME}" now has ${defaultClass.students.length} students`);

    if (successCount > 0) {
      console.log('\n🎉 Auto-migration completed successfully!');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
autoMigrateStudents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

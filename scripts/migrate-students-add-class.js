const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/disorder-teaching-survey', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Student Schema (temporary for migration)
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  DOB: { type: Date, required: true },
  classId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false // Keep optional for migration
  },
  therapists: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String
  }]
}, {
  timestamps: true
});

// Class Schema
const ClassSchema = new mongoose.Schema({
  classNumber: { type: String, required: true, unique: true },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  students: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    name: String,
    DOB: Date,
    classNumber: String
  }],
}, {
  timestamps: true
});

const Student = mongoose.model('Student', StudentSchema);
const Class = mongoose.model('Class', ClassSchema);

async function migrateStudentsWithoutClass() {
  try {
    console.log('Starting migration of students without class assignment...');

    // Find students without classId
    const studentsWithoutClass = await Student.find({
      $or: [
        { classId: null },
        { classId: { $exists: false } }
      ]
    });

    console.log(`Found ${studentsWithoutClass.length} students without class assignment`);

    if (studentsWithoutClass.length === 0) {
      console.log('No students need migration. All students have class assignments.');
      return;
    }

    // Find or create a default "Unassigned" class
    let unassignedClass = await Class.findOne({ classNumber: 'UNASSIGNED' });
    
    if (!unassignedClass) {
      console.log('Creating default "UNASSIGNED" class...');
      unassignedClass = new Class({
        classNumber: 'UNASSIGNED',
        teachers: [],
        students: []
      });
      await unassignedClass.save();
      console.log('Created UNASSIGNED class with ID:', unassignedClass._id);
    } else {
      console.log('Using existing UNASSIGNED class with ID:', unassignedClass._id);
    }

    // Update students to assign them to the UNASSIGNED class
    const updateResult = await Student.updateMany(
      {
        $or: [
          { classId: null },
          { classId: { $exists: false } }
        ]
      },
      {
        $set: { classId: unassignedClass._id }
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} students to UNASSIGNED class`);

    // Also update the UNASSIGNED class to include these students
    const studentsForClass = studentsWithoutClass.map(student => ({
      _id: student._id,
      name: student.name,
      DOB: student.DOB,
      classNumber: 'UNASSIGNED'
    }));

    await Class.findByIdAndUpdate(
      unassignedClass._id,
      {
        $set: { students: studentsForClass }
      }
    );

    console.log(`Updated UNASSIGNED class to include ${studentsForClass.length} students`);
    console.log('Migration completed successfully!');

    // Show summary
    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Students migrated: ${updateResult.modifiedCount}`);
    console.log(`UNASSIGNED class ID: ${unassignedClass._id}`);
    console.log(`Students can now be manually reassigned to appropriate classes via the UI`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

async function main() {
  await connectDB();
  await migrateStudentsWithoutClass();
  await mongoose.connection.close();
  console.log('Database connection closed');
}

// Run the migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});

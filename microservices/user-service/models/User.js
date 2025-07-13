const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // For teachers - references to classes they teach
  classes: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    classNumber: String
  }],
  // For therapists - references to students they work with  
  students: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    name: String
  }]
});

// Add a virtual 'id' field that mirrors '_id'
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id; // Optionally remove _id from the output
  }
});

module.exports = mongoose.model('User', UserSchema);
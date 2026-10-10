const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018';

async function main() {
  console.log('Connecting to', MONGODB_URI);
  // Modern mongoose: do not pass deprecated options
  await mongoose.connect(MONGODB_URI);

  // Require model files and keep exported Model constructors
  const QuestionnaireTemplate = require('../microservices/form-service/models/QuestionnaireTemplate');
  const FormSubmission = require('../microservices/form-service/models/FormSubmission');
  const User = require('../microservices/user-service/models/User');
  const Student = require('../microservices/student-service/models/Student');
  const ClassModel = require('../microservices/student-service/models/Class');
  const Analytics = require('../microservices/analytics-service/models/Analytics');
  const SubmissionAnalytics = require('../microservices/analytics-service/models/SubmissionAnalytics');

  const models = [
    QuestionnaireTemplate,
    FormSubmission,
    User,
    Student,
    ClassModel,
    Analytics,
    SubmissionAnalytics
  ];

  for (const Model of models) {
    try {
      const colName = Model.collection.name;
      const existing = await mongoose.connection.db.listCollections({ name: colName }).toArray();
      if (existing.length === 0) {
        console.log(`Creating collection '${colName}' for model ${Model.modelName}`);
        await mongoose.connection.db.createCollection(colName);
      } else {
        console.log(`Collection '${colName}' already exists`);
      }
      // Ensure indexes defined on the model are created
      await Model.init();
      console.log(`Initialized model ${Model.modelName} (indexes ensured)`);
    } catch (err) {
      console.error(`Error handling model ${Model && Model.modelName ? Model.modelName : 'unknown'}:`, err.message || err);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

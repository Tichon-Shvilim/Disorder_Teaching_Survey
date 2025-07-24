const axios = require('axios');

async function testQuestionnaireAPI() {
  const baseURL = 'http://localhost:3003';
  
  // Set a timeout for all requests
  axios.defaults.timeout = 5000;
  
  try {
    console.log('Testing questionnaire API...');
    
    // First, let's try to get all questionnaire templates
    console.log('1. Getting all questionnaire templates...');
    const templatesResponse = await axios.get(`${baseURL}/api/templates`);
    console.log('Templates found:', templatesResponse.data.data?.length || 0);
    
    if (templatesResponse.data.data && templatesResponse.data.data.length > 0) {
      const firstTemplate = templatesResponse.data.data[0];
      console.log('First template ID:', firstTemplate._id);
      
      // Test getting a specific template
      console.log('2. Getting specific template...');
      try {
        const templateResponse = await axios.get(`${baseURL}/api/templates/${firstTemplate._id}`);
        console.log('Successfully retrieved template:', templateResponse.data.success);
      } catch (error) {
        console.error('Error getting template:', error.response?.status, error.response?.data);
      }
    }
    
    // Let's also check submissions
    console.log('3. Getting all submissions...');
    try {
      const submissionsResponse = await axios.get(`${baseURL}/api/submissions`);
      console.log('Submissions found:', submissionsResponse.data.submissions?.length || 0);
      
      if (submissionsResponse.data.submissions && submissionsResponse.data.submissions.length > 0) {
        const firstSubmission = submissionsResponse.data.submissions[0];
        console.log('First submission questionnaireId:', firstSubmission.questionnaireId);
        console.log('Type of questionnaireId:', typeof firstSubmission.questionnaireId);
        
        // Try to get the template for this submission
        console.log('4. Testing template fetch with submission questionnaireId...');
        try {
          const templateResponse = await axios.get(`${baseURL}/api/templates/${firstSubmission.questionnaireId}`);
          console.log('Successfully retrieved template for submission:', templateResponse.data.success);
        } catch (error) {
          console.error('Error getting template for submission:', error.response?.status, error.response?.data);
        }
      }
    } catch (error) {
      console.error('Error getting submissions:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.code || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testQuestionnaireAPI();

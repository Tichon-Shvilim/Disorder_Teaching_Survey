import { questionnaireApiService } from '../components/formManagement/Api-Requests/questionnaireApi';
import type { FormNode } from '../components/formManagement/models/FormModels';
import { createHebrewQuestionnaireRequest, countQuestions } from '../components/formManagement/hebrewQuestionnaireData';

/**
 * Script to save the Hebrew questionnaire to MongoDB
 * This converts the JSON data to the proper FormNode structure and saves it via API
 */

// Convert the JSON structure to proper FormNode format
const convertToFormNode = (data: any): FormNode => {
  const node: FormNode = {
    id: data.id,
    type: data.type as 'group' | 'question',
    label: data.title,
    title: data.title,
    description: data.description,
    weight: data.weight || 1,
    graphable: data.graphable || false,
    preferredChartType: data.preferredChartType || 'bar',
    children: []
  };

  // Add question-specific properties
  if (data.type === 'question') {
    node.inputType = data.inputType as 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
    node.required = data.required || false;
    
    if (data.options && Array.isArray(data.options)) {
      node.options = data.options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        value: opt.value
      }));
    }
  }

  // Recursively convert children
  if (data.children && Array.isArray(data.children)) {
    node.children = data.children.map(convertToFormNode);
  }

  return node;
};

// Remove duplicate function and use imported one
// const createHebrewQuestionnaireRequest = (): CreateQuestionnaireRequest => {
//   // Note: This would need to be loaded dynamically or embedded as a TypeScript object
//   // For now, return a placeholder structure
//   const structure: FormNode[] = [];

//   // Create graph settings
//   const graphSettings: GraphSettings = {
//     colorRanges: [
//       { label: "נמוך", min: 1, max: 2, color: "#ef4444" },
//       { label: "בינוני", min: 3, max: 3, color: "#fbbf24" },
//       { label: "גבוה", min: 4, max: 5, color: "#10b981" }
//     ]
//   };

//   return {
//     title: "Hebrew Questionnaire",
//     description: "Hebrew questionnaire for assessment",
//     structure,
//     graphSettings
//   };
// };

// Function to save the questionnaire
export const saveHebrewQuestionnaire = async (): Promise<string> => {
  try {
    console.log('🚀 Starting to save Hebrew questionnaire...');
    
    const questionnaireRequest = createHebrewQuestionnaireRequest();
    
    console.log('📋 Questionnaire data prepared:', {
      title: questionnaireRequest.title,
      description: questionnaireRequest.description,
      structureCount: (questionnaireRequest.structure ?? []).length,
      totalQuestions: countQuestions(questionnaireRequest.structure ?? [])
    });

    // Save via API
    const response = await questionnaireApiService.createQuestionnaire(questionnaireRequest);
    
    if (response.success && response.data) {
      console.log('✅ Hebrew questionnaire saved successfully!');
      console.log('📊 Questionnaire ID:', response.data._id);
      console.log('📈 Total questions:', response.data.metadata?.totalQuestions || 'Unknown');
      console.log('🎯 Graphable questions:', response.data.metadata?.graphableQuestions || 'Unknown');
      
      return response.data._id ?? '';
    } else {
      console.error('❌ Failed to save questionnaire:', response.errors || response.message);
      throw new Error(response.message || 'Failed to save questionnaire');
    }
  } catch (error) {
    console.error('💥 Error saving Hebrew questionnaire:', error);
    throw error;
  }
};

// Remove duplicate function and use imported one
// const countQuestions = (nodes: FormNode[]): number => {
//   let count = 0;
//   for (const node of nodes) {
//     if (node.type === 'question') {
//       count++;
//     }
//     if (node.children) {
//       count += countQuestions(node.children);
//     }
//   }
//   return count;
// };

// Function to validate the questionnaire structure before saving
export const validateHebrewQuestionnaire = async (): Promise<boolean> => {
  try {
    console.log('🔍 Validating Hebrew questionnaire structure...');
    
    const questionnaireRequest = createHebrewQuestionnaireRequest();
    const response = await questionnaireApiService.validateStructure(questionnaireRequest.structure ?? []);
    
    if (response.success && response.data) {
      console.log('✅ Questionnaire structure is valid!');
      console.log('📊 Validation results:', response.data);
      return true;
    } else {
      console.error('❌ Questionnaire structure validation failed:', response.errors);
      return false;
    }
  } catch (error) {
    console.error('💥 Error validating questionnaire:', error);
    return false;
  }
};

// Export the questionnaire data for external use
// export { createHebrewQuestionnaireRequest }; // Already imported

// If running directly (for testing)
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  console.log('Running Hebrew questionnaire save script...');
  saveHebrewQuestionnaire().then(() => {
    console.log('Script completed successfully!');
  }).catch((error) => {
    console.error('Script failed:', error);
    // Exit only if process is available
    if (typeof (globalThis as any).process !== 'undefined') {
      (globalThis as any).process.exit(1);
    }
  });
}

import axios from 'axios';

const API_BASE_URL = 'http://localhost:4003/api';

// Types for form submissions
export interface FormAnswer {
  questionId: string;
  questionText: string;
  questionType: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale';
  answer: string | number | (string | number)[];
  selectedOptions?: {
    id: string;
    label: string;
    value: number;
  }[];
}

export interface FormSubmission {
  _id?: string;
  studentId: string;
  studentName: string;
  questionnaireId: string | { _id: string; title: string; description?: string };
  questionnaireTitle: string;
  answers: FormAnswer[];
  submittedAt?: Date;
  completedBy?: string;
  completedById?: string; // User ID of the person who completed the form
  status?: 'draft' | 'completed' | 'reviewed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionnaireTemplate {
  _id: string;
  title: string;
  description: string;
  domains: {
    id: string;
    name: string;
    description: string;
    color: string;
  }[];
  questions: {
    text: string;
    domainId: string;
    type: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale';
    options: {
      id: string;
      value: number;
      label: string;
      subQuestions?: {
        text: string;
        domainId: string;
        type: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale';
        options: {
          id: string;
          value: number;
          label: string;
        }[];
        required: boolean;
        helpText?: string;
        order: number;
      }[];
    }[];
    required: boolean;
    helpText?: string;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to parse malformed option strings
const parseQuestionOptions = (options: unknown): { id: string; value: number; label: string }[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map(option => {
      if (typeof option === 'string' && option.startsWith('@{')) {
        // Parse PowerShell-style object string: "@{id=opt-0; value=1; label=1; subQuestions=System.Object[]}"
        try {
          const matches = option.match(/id=([^;]+).*?value=([^;]+).*?label=([^;]+)/);
          if (matches) {
            return {
              id: matches[1].trim(),
              value: parseInt(matches[2].trim()) || 0,
              label: matches[3].trim()
            };
          }
        } catch {
          console.warn('Failed to parse option string:', option);
        }
        return { id: 'unknown', value: 0, label: 'Unknown Option' };
      }
      
      // If it's already an object, just return it
      if (typeof option === 'object' && option !== null) {
        return option;
      }
      
      return option;
    });
  }
  return [];
};

// Helper function to fix questionnaire data structure
const fixQuestionnaireData = (data: QuestionnaireTemplate): QuestionnaireTemplate => {
  if (!data) return data;
  
  if (data.questions && Array.isArray(data.questions)) {
    data.questions = data.questions.map((question) => ({
      ...question,
      options: parseQuestionOptions(question.options)
    }));
  }
  
  return data;
};

// API Functions
export const FormAPIService = {
  // Get all questionnaire templates
  async getQuestionnaireTemplates() {
    const response = await axios.get(`${API_BASE_URL}/questionnaires/templates`);
    const data = response.data.data || response.data;
    
    // Fix the data structure for all questionnaires
    if (Array.isArray(data)) {
      return data.map(fixQuestionnaireData);
    }
    return data;
  },

  // Get specific questionnaire template
  async getQuestionnaireTemplate(id: string) {
    const response = await axios.get(`${API_BASE_URL}/questionnaires/templates/${id}`);
    const data = response.data.data || response.data;
    
    // Fix the data structure
    return fixQuestionnaireData(data);
  },

  // Submit completed form
  async submitForm(submission: Omit<FormSubmission, '_id' | 'submittedAt' | 'createdAt' | 'updatedAt'>) {
    const response = await axios.post(`${API_BASE_URL}/forms/submissions`, submission);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
  },

  // Get all submissions for a student
  async getStudentSubmissions(studentId: string) {
    const response = await axios.get(`${API_BASE_URL}/forms/submissions/student/${studentId}`);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
  },

  // Get specific submission
  async getSubmission(id: string) {
    const response = await axios.get(`${API_BASE_URL}/forms/submissions/${id}`);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
  },

  // Update submission
  async updateSubmission(id: string, updates: Partial<FormSubmission>) {
    const response = await axios.put(`${API_BASE_URL}/forms/submissions/${id}`, updates);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
  },

  // Delete submission
  async deleteSubmission(id: string) {
    const response = await axios.delete(`${API_BASE_URL}/forms/submissions/${id}`);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
  }
};

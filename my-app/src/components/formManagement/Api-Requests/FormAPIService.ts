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
  questionnaireId: string;
  questionnaireTitle: string;
  answers: FormAnswer[];
  submittedAt?: Date;
  completedBy?: string;
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
    }[];
    required: boolean;
    helpText?: string;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// API Functions
export const FormAPIService = {
  // Get all questionnaire templates
  async getQuestionnaireTemplates() {
    const response = await axios.get(`${API_BASE_URL}/questionnaires/templates`);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
  },

  // Get specific questionnaire template
  async getQuestionnaireTemplate(id: string) {
    const response = await axios.get(`${API_BASE_URL}/questionnaires/templates/${id}`);
    // Handle the case where API response is wrapped in a 'data' property
    return response.data.data || response.data;
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

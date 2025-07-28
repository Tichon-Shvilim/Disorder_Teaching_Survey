import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';
import type { AxiosResponse, AxiosError } from 'axios';
import type { 
  ApiResponse, 
  FormSubmission, 
  QuestionnaireTemplate 
} from '../models/FormModels';

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

class FormApiService {
  private handleResponse<T>(response: AxiosResponse): ApiResponse<T> {
    try {
      // If the response has a success field, use it; otherwise assume success if data exists
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }
      
      // For direct data responses, wrap in our ApiResponse format
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generic error handler for API responses
   */
  private handleError(error: AxiosError | Error | unknown): ApiResponse<never> {
    console.error('API request failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        const responseData = axiosError.response.data as Record<string, unknown>;
        if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }

  // Get all questionnaire templates
  async getQuestionnaireTemplates(): Promise<QuestionnaireTemplate[]> {
    try {
      const response = await getAllItems<QuestionnaireTemplate[]>('api/questionnaires/templates');
      const apiResponse = this.handleResponse<QuestionnaireTemplate[]>(response);
      
      if (apiResponse.success && apiResponse.data) {
        // Fix the data structure for all questionnaires
        if (Array.isArray(apiResponse.data)) {
          return apiResponse.data.map(fixQuestionnaireData);
        }
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch questionnaire templates');
    } catch (error) {
      console.error('Error fetching questionnaire templates:', error);
      throw error;
    }
  }

  // Get specific questionnaire template
  async getQuestionnaireTemplate(id: string): Promise<QuestionnaireTemplate> {
    try {
      const response = await getItemById<QuestionnaireTemplate>('api/questionnaires/templates', id);
      const apiResponse = this.handleResponse<QuestionnaireTemplate>(response);
      
      if (apiResponse.success && apiResponse.data) {
        // Fix the data structure
        return fixQuestionnaireData(apiResponse.data);
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch questionnaire template');
    } catch (error) {
      console.error('Error fetching questionnaire template:', error);
      throw error;
    }
  }

  // Submit completed form
  async submitForm(submission: Omit<FormSubmission, '_id' | 'submittedAt' | 'createdAt' | 'updatedAt'>): Promise<FormSubmission> {
    try {
      const response = await addItem<FormSubmission>('api/forms/submissions', submission);
      const apiResponse = this.handleResponse<FormSubmission>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to submit form');
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }

  // Get all submissions for a student
  async getStudentSubmissions(studentId: string): Promise<FormSubmission[]> {
    try {
      const response = await getAllItems<FormSubmission[]>(`api/forms/submissions/student/${studentId}`);
      const apiResponse = this.handleResponse<FormSubmission[]>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch student submissions');
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      throw error;
    }
  }

  // Get specific submission
  async getSubmission(id: string): Promise<FormSubmission> {
    try {
      const response = await getItemById<FormSubmission>('api/forms/submissions', id);
      const apiResponse = this.handleResponse<FormSubmission>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch submission');
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  }

  // Update submission
  async updateSubmission(id: string, updates: Partial<FormSubmission>): Promise<FormSubmission> {
    try {
      const response = await updateItem<Partial<FormSubmission>>('api/forms/submissions', id, updates);
      const apiResponse = this.handleResponse<FormSubmission>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to update submission');
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  }

  // Delete submission
  async deleteSubmission(id: string): Promise<void> {
    try {
      const response = await deleteItem('api/forms/submissions', id);
      const apiResponse = this.handleResponse<void>(response);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const FormAPIService = new FormApiService();

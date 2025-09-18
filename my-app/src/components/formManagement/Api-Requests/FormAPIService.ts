import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';
import type { AxiosResponse } from 'axios';
import type { 
  QuestionnaireTemplate, 
  FormSubmission,
  FormAnswer
} from '../models/FormModels';

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Submit form data interface
interface SubmitFormData {
  studentId: string;
  questionnaireId: string;
  answers: FormAnswer[];
  status: 'draft' | 'completed';
  notes?: string;
}

// Submit response interface  
interface SubmitFormResponse {
  submissionId: string;
  studentName: string;
  questionnaireTitle: string;
  status: string;
  submittedAt: Date | null;
  answersCount: number;
}

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

  // Get all  questionnaire templates
  async getQuestionnaireTemplates(): Promise<QuestionnaireTemplate[]> {
    try {
      const response = await getAllItems<QuestionnaireTemplate[]>('api/questionnaires/templates');
      const apiResponse = this.handleResponse<QuestionnaireTemplate[]>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return Array.isArray(apiResponse.data) ? apiResponse.data : [];
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch questionnaire templates');
    } catch (error) {
      console.error('Error fetching  questionnaire templates:', error);
      throw error;
    }
  }

  // Get specific  questionnaire template
  async getQuestionnaireTemplate(id: string): Promise<QuestionnaireTemplate> {
    try {
      const response = await getItemById<QuestionnaireTemplate>('api/questionnaires/templates', id);
      const apiResponse = this.handleResponse<QuestionnaireTemplate>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch questionnaire template');
    } catch (error) {
      console.error('Error fetching  questionnaire template:', error);
      throw error;
    }
  }

  // Submit  form
  async submitForm(submission: SubmitFormData): Promise<SubmitFormResponse> {
    try {
      const response = await addItem<SubmitFormData>('api/forms/submit', submission);
      const apiResponse = this.handleResponse<SubmitFormResponse>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to submit form');
    } catch (error) {
      console.error('Error submitting  form:', error);
      throw error;
    }
  }

  // Get all  submissions (with role-based filtering on backend)
  async getSubmissions(params?: {
    questionnaireId?: string;
    studentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: FormSubmission[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.questionnaireId) queryParams.append('questionnaireId', params.questionnaireId);
      if (params?.studentId) queryParams.append('studentId', params.studentId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `api/forms/submissions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await getAllItems<{
        data: FormSubmission[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(url);
      
      const apiResponse = this.handleResponse<{
        data: FormSubmission[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(response);
      
      if (apiResponse.success) {
        // The server returns {success: true, data: [...], pagination: {...}}
        // We need to restructure this to match our expected format
        const serverResponse = apiResponse as unknown as {
          success: boolean;
          data: FormSubmission[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
          };
        };
        const restructuredData = {
          data: serverResponse.data || [],
          pagination: serverResponse.pagination || {
            page: 1,
            limit: 20,
            total: Array.isArray(serverResponse.data) ? serverResponse.data.length : 0,
            pages: 1
          }
        };
        return restructuredData;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch submissions');
    } catch (error) {
      console.error('Error fetching  submissions:', error);
      throw error;
    }
  }

  // Get student submissions (legacy compatibility method)
  async getStudentSubmissions(studentId: string): Promise<FormSubmission[]> {
    try {
      const result = await this.getSubmissions({ studentId });
      return result.data;
    } catch (error) {
      console.error('Error fetching student  submissions:', error);
      throw error;
    }
  }

  // Get specific  submission
  async getSubmission(id: string): Promise<FormSubmission> {
    try {
      const response = await getItemById<FormSubmission>('api/forms/submissions', id);
      const apiResponse = this.handleResponse<FormSubmission>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch submission');
    } catch (error) {
      console.error('Error fetching  submission:', error);
      throw error;
    }
  }

  // Update  submission
  async updateSubmission(id: string, updates: Partial<{
    answers: FormAnswer[];
    status: 'draft' | 'completed' | 'reviewed';
    notes: string;
  }>): Promise<FormSubmission> {
    try {
      const response = await updateItem<Partial<FormSubmission>>('api/forms/submissions', id, updates);
      const apiResponse = this.handleResponse<FormSubmission>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to update submission');
    } catch (error) {
      console.error('Error updating  submission:', error);
      throw error;
    }
  }

  // Delete  submission (Admin only)
  async deleteSubmission(id: string): Promise<void> {
    try {
      const response = await deleteItem('api/forms/submissions', id);
      const apiResponse = this.handleResponse<void>(response);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting  submission:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const FormAPIService = new FormApiService();

import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';
import type { AxiosResponse } from 'axios';
import type { 
  QuestionnaireTemplateV2, 
  FormSubmissionV2,
  FormAnswerV2
} from '../models/FormModelsV2';

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Submit form data interface
interface SubmitFormV2Data {
  studentId: string;
  questionnaireId: string;
  answers: FormAnswerV2[];
  status: 'draft' | 'completed';
  notes?: string;
}

// Submit response interface  
interface SubmitFormV2Response {
  submissionId: string;
  studentName: string;
  questionnaireTitle: string;
  status: string;
  submittedAt: Date | null;
  answersCount: number;
}

class FormApiServiceV2 {
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

  // Get all V2 questionnaire templates
  async getQuestionnaireTemplates(): Promise<QuestionnaireTemplateV2[]> {
    try {
      const response = await getAllItems<QuestionnaireTemplateV2[]>('api/questionnaires/v2/templates');
      const apiResponse = this.handleResponse<QuestionnaireTemplateV2[]>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return Array.isArray(apiResponse.data) ? apiResponse.data : [];
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch questionnaire templates');
    } catch (error) {
      console.error('Error fetching V2 questionnaire templates:', error);
      throw error;
    }
  }

  // Get specific V2 questionnaire template
  async getQuestionnaireTemplate(id: string): Promise<QuestionnaireTemplateV2> {
    try {
      const response = await getItemById<QuestionnaireTemplateV2>('api/questionnaires/v2/templates', id);
      const apiResponse = this.handleResponse<QuestionnaireTemplateV2>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch questionnaire template');
    } catch (error) {
      console.error('Error fetching V2 questionnaire template:', error);
      throw error;
    }
  }

  // Submit V2 form
  async submitForm(submission: SubmitFormV2Data): Promise<SubmitFormV2Response> {
    try {
      const response = await addItem<SubmitFormV2Data>('api/forms/v2/submit', submission);
      const apiResponse = this.handleResponse<SubmitFormV2Response>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to submit form');
    } catch (error) {
      console.error('Error submitting V2 form:', error);
      throw error;
    }
  }

  // Get all V2 submissions (with role-based filtering on backend)
  async getSubmissions(params?: {
    questionnaireId?: string;
    studentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: FormSubmissionV2[];
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

      const url = `api/forms/v2/submissions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await getAllItems<{
        data: FormSubmissionV2[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(url);
      
      const apiResponse = this.handleResponse<{
        data: FormSubmissionV2[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch submissions');
    } catch (error) {
      console.error('Error fetching V2 submissions:', error);
      throw error;
    }
  }

  // Get student submissions (legacy compatibility method)
  async getStudentSubmissions(studentId: string): Promise<FormSubmissionV2[]> {
    try {
      const result = await this.getSubmissions({ studentId });
      return result.data;
    } catch (error) {
      console.error('Error fetching student V2 submissions:', error);
      throw error;
    }
  }

  // Get specific V2 submission
  async getSubmission(id: string): Promise<FormSubmissionV2> {
    try {
      const response = await getItemById<FormSubmissionV2>('api/forms/v2/submissions', id);
      const apiResponse = this.handleResponse<FormSubmissionV2>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch submission');
    } catch (error) {
      console.error('Error fetching V2 submission:', error);
      throw error;
    }
  }

  // Update V2 submission
  async updateSubmission(id: string, updates: Partial<{
    answers: FormAnswerV2[];
    status: 'draft' | 'completed' | 'reviewed';
    notes: string;
  }>): Promise<FormSubmissionV2> {
    try {
      const response = await updateItem<Partial<FormSubmissionV2>>('api/forms/v2/submissions', id, updates);
      const apiResponse = this.handleResponse<FormSubmissionV2>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to update submission');
    } catch (error) {
      console.error('Error updating V2 submission:', error);
      throw error;
    }
  }

  // Delete V2 submission (Admin only)
  async deleteSubmission(id: string): Promise<void> {
    try {
      const response = await deleteItem('api/forms/v2/submissions', id);
      const apiResponse = this.handleResponse<void>(response);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting V2 submission:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const FormAPIServiceV2 = new FormApiServiceV2();

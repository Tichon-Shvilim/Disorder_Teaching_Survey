import type { CreateQuestionnaireRequest, QuestionnaireModel, DomainModel } from '../models/FormModels';
import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';
import type { AxiosResponse, AxiosError } from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class QuestionnaireApiService {
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

  // Create a new questionnaire template
  async createQuestionnaire(questionnaireData: CreateQuestionnaireRequest): Promise<ApiResponse<QuestionnaireModel>> {
    try {
      const response = await addItem('api/questionnaires/templates', questionnaireData);
      return this.handleResponse<QuestionnaireModel>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get all questionnaire templates
  async getQuestionnaires(): Promise<ApiResponse<QuestionnaireModel[]>> {
    try {
      const response = await getAllItems<QuestionnaireModel[]>('api/questionnaires/templates');
      return this.handleResponse<QuestionnaireModel[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get a specific questionnaire template by ID
  async getQuestionnaire(id: string): Promise<ApiResponse<QuestionnaireModel>> {
    try {
      const response = await getItemById<QuestionnaireModel>('api/questionnaires/templates', id);
      return this.handleResponse<QuestionnaireModel>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update a questionnaire template
  async updateQuestionnaire(
    id: string, 
    questionnaireData: CreateQuestionnaireRequest
  ): Promise<ApiResponse<QuestionnaireModel>> {
    try {
      const response = await updateItem('api/questionnaires/templates', id, questionnaireData);
      return this.handleResponse<QuestionnaireModel>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete a questionnaire template
  async deleteQuestionnaire(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await deleteItem<void>('api/questionnaires/templates', id);
      return this.handleResponse<void>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get all domains
  async getDomains(): Promise<ApiResponse<DomainModel[]>> {
    try {
      const response = await getAllItems<DomainModel[]>('api/questionnaires/domains');
      return this.handleResponse<DomainModel[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const questionnaireApiService = new QuestionnaireApiService();

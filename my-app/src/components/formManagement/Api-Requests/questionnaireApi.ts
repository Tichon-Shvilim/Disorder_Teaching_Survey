import type { AxiosResponse, AxiosError } from 'axios';
import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';
import type {
  QuestionnaireTemplateWithMetadata,
  CreateQuestionnaireRequest,
  FormNode,
  ApiResponse,
  QuestionnaireMetadata
} from '../models/FormModels';

/**
 * Enhanced Questionnaire API service for  hierarchical questionnaires
 * Handles API requests for the new tree-based structure
 */
class QuestionnaireApiService {
  private readonly baseEndpoint = 'api/questionnaires';

  /**
   * Handle successful API responses
   */
  private handleResponse<T>(response: AxiosResponse): ApiResponse<T> {
    try {
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Handle API request errors
   */
  private handleError(error: AxiosError | Error | unknown): ApiResponse<never> {
    console.error(' API request failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    let errors: string[] = [];
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        const responseData = axiosError.response.data as Record<string, unknown>;
        
        if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        }
        
        if (Array.isArray(responseData.errors)) {
          errors = responseData.errors;
        } else if (typeof responseData.error === 'string') {
          errors = [responseData.error];
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      errors: errors.length > 0 ? errors : [errorMessage]
    };
  }

  /**
   * Create a new enhanced questionnaire template
   */
  async createQuestionnaire(
    questionnaireData: CreateQuestionnaireRequest
  ): Promise<ApiResponse<QuestionnaireTemplateWithMetadata>> {
    try {
      const response = await addItem(`${this.baseEndpoint}/templates`, questionnaireData);
      return this.handleResponse<QuestionnaireTemplateWithMetadata>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all enhanced questionnaire templates with metadata
   */
  async getQuestionnaires(): Promise<ApiResponse<QuestionnaireTemplateWithMetadata[]>> {
    try {
      const response = await getAllItems<QuestionnaireTemplateWithMetadata[]>(`${this.baseEndpoint}/templates`);
      return this.handleResponse<QuestionnaireTemplateWithMetadata[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific enhanced questionnaire template by ID with metadata
   */
  async getQuestionnaire(id: string): Promise<ApiResponse<QuestionnaireTemplateWithMetadata>> {
    try {
      const response = await getItemById<QuestionnaireTemplateWithMetadata>(`${this.baseEndpoint}/templates`, id);
      return this.handleResponse<QuestionnaireTemplateWithMetadata>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update an enhanced questionnaire template
   */
  async updateQuestionnaire(
    id: string, 
    questionnaireData: CreateQuestionnaireRequest
  ): Promise<ApiResponse<QuestionnaireTemplateWithMetadata>> {
    try {
      const response = await updateItem(`${this.baseEndpoint}/templates`, id, questionnaireData);
      return this.handleResponse<QuestionnaireTemplateWithMetadata>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete an enhanced questionnaire template
   */
  async deleteQuestionnaire(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await deleteItem<void>(`${this.baseEndpoint}/templates`, id);
      return this.handleResponse<void>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all questions from a questionnaire (flattened structure)
   */
  async getQuestionnaireQuestions(id: string): Promise<ApiResponse<FormNode[]>> {
    try {
      const response = await getAllItems<FormNode[]>(`${this.baseEndpoint}/templates/${id}/questions`);
      return this.handleResponse<FormNode[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate questionnaire structure without saving
   */
  async validateStructure(structure: FormNode[]): Promise<ApiResponse<QuestionnaireMetadata>> {
    try {
      const response = await addItem(`${this.baseEndpoint}/templates/validate`, { structure });
      return this.handleResponse<QuestionnaireMetadata>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Helper method to create default node structures
   */
  createDefaultGroup(title: string, description?: string): FormNode {
    return {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'group',
      title,
      description,
      weight: 1,
      graphable: false,
      preferredChartType: 'bar',
      children: []
    };
  }

  /**
   * Helper method to create default question structures
   */
  createDefaultQuestion(
    title: string, 
    inputType: FormNode['inputType'] = 'single-choice',
    description?: string
  ): FormNode {
    const baseQuestion: FormNode = {
      id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'question',
      title,
      description,
      weight: 1,
      inputType,
      graphable: true,
      preferredChartType: 'bar',
      children: []
    };

    // Add default options for choice-based questions
    if (inputType === 'single-choice' || inputType === 'multiple-choice') {
      baseQuestion.options = [
        { id: 'opt-1', label: 'Never', value: 1 },
        { id: 'opt-2', label: 'Sometimes', value: 3 },
        { id: 'opt-3', label: 'Often', value: 5 }
      ];
    } else if (inputType === 'scale') {
      baseQuestion.options = [
        { id: 'scale-1', label: '1', value: 1 },
        { id: 'scale-2', label: '2', value: 2 },
        { id: 'scale-3', label: '3', value: 3 },
        { id: 'scale-4', label: '4', value: 4 },
        { id: 'scale-5', label: '5', value: 5 }
      ];
    }

    return baseQuestion;
  }
}

// Export singleton instance
export const questionnaireApiService = new QuestionnaireApiService();
export default questionnaireApiService;

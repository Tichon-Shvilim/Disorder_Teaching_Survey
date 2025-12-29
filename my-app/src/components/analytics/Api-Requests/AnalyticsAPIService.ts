import { getAllItems, getItemById, addItem } from './genericRequests';
import type { AxiosResponse } from 'axios';

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Domain Score interface
interface DomainScore {
  nodeId: string;
  title: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
}

// Submission Analytics interface
interface SubmissionAnalytics {
  submissionId: string;
  studentId: string;
  studentName: string;
  questionnaireTitle: string;
  overallScore: number;
  domainScores: DomainScore[];
  submittedAt: string;
}

class AnalyticsApiService {
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
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get submission analytics
  async getSubmissionAnalytics(submissionId: string): Promise<SubmissionAnalytics> {
    try {
      const response = await getItemById<SubmissionAnalytics>('api/analytics/submission', submissionId);
      const apiResponse = this.handleResponse<SubmissionAnalytics>(response);
      
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      
      throw new Error(apiResponse.error || 'Failed to fetch submission analytics');
    } catch (error) {
      console.error('Error fetching submission analytics:', error);
      throw error;
    }
  }

  // Calculate analytics for submission
  async calculateAnalytics(submissionId: string): Promise<void> {
    try {
      const response = await addItem<{}>(`api/analytics/calculate/${submissionId}`, {});
      const apiResponse = this.handleResponse<void>(response);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to calculate analytics');
      }
    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const AnalyticsAPIService = new AnalyticsApiService();
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_FORM_SERVICE_URL || 'http://localhost:3003';

// Interface definitions for scoring responses
export interface GraphSettings {
  colorRanges: Array<{
    label: string;
    min: number;
    max: number;
    color: string;
  }>;
}

export interface QuestionScore {
  questionId: string;
  questionTitle: string;
  rawAnswer: string | number | (string | number)[];
  normalizedScore: number;
  weight: number;
  weightedScore: number;
  nodePath: string[];
}

export interface NodeScore {
  nodeId: string;
  nodePath: string[];
  title: string;
  score: number;
  maxScore: number;
  answeredQuestions: number;
  totalQuestions: number;
  weightedScore: number;
  totalWeight: number;
  details: QuestionScore[];
}

export interface DomainScore {
  nodeId: string;
  nodePath: string[];
  title: string;
  score: number;
  maxScore: number;
  answeredQuestions: number;
  totalQuestions: number;
  weightedScore: number;
  totalWeight: number;
}

export interface SubmissionScore {
  submissionId: string;
  studentName: string;
  questionnaireTitle: string;
  submittedAt: string;
  overallScore: number;
  totalWeight: number;
  nodeScores: NodeScore[];
  graphSettings?: GraphSettings;
}

export interface UpdatedSubmission {
  submissionId: string;
  studentName: string;
  totalScore: number;
  domainCount: number;
}

export interface ScoreError {
  submissionId: string;
  error: string;
}

export interface BulkScoreResponse {
  questionnaire: {
    id: string;
    title: string;
    graphSettings?: GraphSettings;
  };
  submissions: Array<{
    submissionId: string;
    studentId: string;
    studentName: string;
    submittedAt: string;
    overallScore: number;
    nodeScores: NodeScore[];
  }>;
  aggregatedScores: Record<string, {
    nodePath: string[];
    nodeTitle: string;
    submissionCount: number;
    averageScore: number;
    medianScore: number;
    minScore: number;
    maxScore: number;
    standardDeviation: number;
    scores: number[];
  }>;
  totalSubmissions: number;
}

export interface GraphableGroup {
  nodeId: string;
  nodePath: string[];
  title: string;
  depth: number;
  questionCount: number;
}

export interface GraphableQuestion {
  nodeId: string;
  nodePath: string[];
  title: string;
  inputType: string;
  options?: Array<{ id: string; label: string; value: number }>;
  weight: number;
  preferredChartType: string;
}

export interface ScoringMetadata {
  questionnaire: {
    id: string;
    title: string;
    graphSettings?: GraphSettings;
  };
  graphableGroups: GraphableGroup[];
  graphableQuestions: GraphableQuestion[];
  totalGraphableNodes: number;
  totalGraphableQuestions: number;
}

export class ScoringAPIService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Calculate scores for a specific submission
   */
  static async getSubmissionScores(submissionId: string): Promise<SubmissionScore> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/scoring/submissions/${submissionId}/scores`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch submission scores');
      }
    } catch (error: unknown) {
      console.error('Error fetching submission scores:', error);
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch submission scores');
    }
  }

  /**
   * Calculate scores for multiple submissions (for group analytics)
   */
  static async getBulkSubmissionScores(
    submissionIds: string[],
    questionnaireId?: string
  ): Promise<BulkScoreResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/scoring/submissions/bulk-scores`,
        {
          submissionIds,
          questionnaireId
        },
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch bulk scores');
      }
    } catch (error: unknown) {
      console.error('Error fetching bulk scores:', error);
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch bulk scores');
    }
  }

  /**
   * Get scoring metadata for a questionnaire (graphable groups and questions)
   */
  static async getScoringMetadata(questionnaireId: string): Promise<ScoringMetadata> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/scoring/questionnaires/${questionnaireId}/scoring-metadata`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch scoring metadata');
      }
    } catch (error: unknown) {
      console.error('Error fetching scoring metadata:', error);
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch scoring metadata');
    }
  }

  /**
   * Update submission with calculated scores (store them in the database)
   */
  static async updateSubmissionScores(submissionId: string): Promise<{
    submissionId: string;
    totalScore: number;
    domainScores: DomainScore[];
    allNodeScores: NodeScore[];
  }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/scoring/submissions/${submissionId}/update-scores`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update submission scores');
      }
    } catch (error: unknown) {
      console.error('Error updating submission scores:', error);
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Failed to update submission scores');
    }
  }

  /**
   * Batch update scores for multiple submissions (Admin only)
   */
  static async batchUpdateScores(
    submissionIds: string[],
    questionnaireId?: string
  ): Promise<{
    updatedSubmissions: UpdatedSubmission[];
    errors: ScoreError[];
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/scoring/submissions/batch-update-scores`,
        {
          submissionIds,
          questionnaireId
        },
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to batch update scores');
      }
    } catch (error: unknown) {
      console.error('Error batch updating scores:', error);
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Failed to batch update scores');
    }
  }

  /**
   * Helper method to get submissions by student and calculate scores
   */
  static async getStudentSubmissionScores(
    studentId: string,
    questionnaireId?: string
  ): Promise<Array<{
    submissionId: string;
    studentId: string;
    studentName: string;
    submittedAt: string;
    overallScore: number;
    nodeScores: NodeScore[];
  }>> {
    try {
      // First, get submissions for this student
      const FormAPIService = await import('./FormAPIService');
      const submissions = await FormAPIService.FormAPIService.getStudentSubmissions(studentId);
      
      // Filter by questionnaire if specified
      const filteredSubmissions = questionnaireId 
        ? submissions.filter((s: { questionnaireId: string }) => s.questionnaireId === questionnaireId)
        : submissions;

      if (filteredSubmissions.length === 0) {
        return [];
      }

      // Get submission IDs
      const submissionIds = filteredSubmissions.map((s: { _id: string }) => s._id);
      
      // Get bulk scores
      const bulkScores = await this.getBulkSubmissionScores(submissionIds, questionnaireId);
      
      return bulkScores.submissions;
    } catch (error: unknown) {
      console.error('Error fetching student submission scores:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch student submission scores';
      throw new Error(errorMessage);
    }
  }
}

export default ScoringAPIService;

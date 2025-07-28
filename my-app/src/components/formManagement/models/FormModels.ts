// ============================================================================
// FORM MANAGEMENT TYPE DEFINITIONS
// ============================================================================
// This file contains all type definitions for the form management system.
// Types are organized into logical sections for better maintainability.

// ============================================================================
// CORE QUESTION & QUESTIONNAIRE TYPES
// ============================================================================

/**
 * Domain definition for categorizing questions in questionnaires
 */
export interface DomainModel {
  _id: string;
  name: string;
  description?: string;
  color?: string;
}

/**
 * Option for single-choice and multiple-choice questions
 */
export interface OptionModel {
  id: string;
  value: number;
  label: string;
  subQuestions?: QuestionModel[];
}

/**
 * Individual question in a questionnaire
 */
export interface QuestionModel {
  _id: string;
  text: string;
  domainId: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale';
  options: OptionModel[];
  required?: boolean;
  helpText?: string;
  order: number;
  parentQuestionId?: string;
  parentOptionId?: string;
}

/**
 * Complete questionnaire template with all metadata
 */
export interface QuestionnaireModel {
  _id: string;
  title: string;
  description?: string;
  domains: DomainModel[];
  questions: QuestionModel[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// ============================================================================
// FORM SUBMISSION TYPES
// ============================================================================

/**
 * Individual answer for a question in a form submission
 */
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

/**
 * Complete form submission with all metadata
 */
export interface FormSubmission {
  _id?: string;
  studentId: string;
  studentName: string;
  questionnaireId: string | { _id: string; title: string; description?: string };
  questionnaireTitle: string;
  answers: FormAnswer[];
  submittedAt?: Date;
  completedBy?: string; // User's name for display
  completedById?: string; // User's ID for robust identification
  status?: 'draft' | 'completed' | 'reviewed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Payload for creating new questionnaires
 */
export interface CreateQuestionnaireRequest {
  title: string;
  description?: string;
  domains: Omit<DomainModel, '_id'>[];
  questions: (Omit<QuestionModel, '_id' | 'options'> & {
    options: (Omit<OptionModel, 'id' | 'subQuestions'> & {
      subQuestions?: Omit<QuestionModel, '_id'>[];
    })[];
  })[];
}

/**
 * Payload for creating new form submissions
 */
export interface CreateFormSubmissionPayload {
  studentId: string;
  studentName: string;
  questionnaireId: string;
  questionnaireTitle: string;
  answers: FormAnswer[];
  completedBy?: string;
  completedById?: string;
  notes?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Form data for question creation/editing (without database ID)
 */
export type QuestionFormData = Omit<QuestionModel, '_id'>;

/**
 * Simplified questionnaire template for API responses
 */
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




/**
 * Enhanced TypeScript interfaces for V2 Questionnaire System
 * Supporting hierarchical structure with groups and questions
 */

// User interface for populated references
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Option for choice-based questions
export interface OptionV2 {
  id: string;
  label: string;
  value: number;
}

// Conditional logic for showing questions based on parent selections
export interface NodeCondition {
  parentQuestionId?: string;
  parentOptionId?: string;
}

// Graph settings for analytics
export interface GraphSettings {
  colorRanges: Array<{
    label: string;     // e.g. "Low", "Medium", "High"
    min: number;
    max: number;
    color: string;     // e.g. "#ef4444", "#fbbf24", "#10b981"
  }>;
}

// Recursive FormNode - can be either a group (domain/subdomain) or a question
export interface FormNodeV2 {
  id: string;
  type: 'group' | 'question';
  title: string;
  description?: string;
  weight: number;
  
  // Question-specific fields
  inputType?: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
  options?: OptionV2[];
  
  // Conditional logic
  condition?: NodeCondition;
  
  // Analytics configuration
  graphable: boolean;
  preferredChartType: 'bar' | 'line' | 'radar' | 'gauge' | 'pie';
  
  // Hierarchical structure
  children: FormNodeV2[];
}

// Complete questionnaire template V2
export interface QuestionnaireTemplateV2 {
  _id: string;
  title: string;
  description?: string;
  structure: FormNodeV2[];
  graphSettings?: GraphSettings;
  isActive: boolean;
  createdBy: string | User;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Metadata provided by the API
export interface QuestionnaireMetadata {
  totalQuestions: number;
  totalNodes: number;
  maxPossibleScore: number;
  graphableQuestions: number;
  nodePaths?: Array<{
    nodeId: string;
    nodePath: string[];
    type: 'group' | 'question';
  }>;
}

// Full questionnaire with metadata
export interface QuestionnaireTemplateV2WithMetadata extends QuestionnaireTemplateV2 {
  metadata: QuestionnaireMetadata;
}

// For form creation/editing
export interface CreateQuestionnaireV2Request {
  title: string;
  description?: string;
  structure: FormNodeV2[];
  graphSettings?: GraphSettings;
}

// Enhanced form submission interfaces
export interface FormAnswerV2 {
  questionId: string;
  nodePath: string[];
  inputType: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
  answer: string | number | (string | number)[];
  selectedOptions?: OptionV2[];
  questionTitle?: string;
  weight: number;
  graphable: boolean;
}

export interface DomainScore {
  nodeId: string;
  nodePath: string[];
  title: string;
  score: number;
  maxScore: number;
}

export interface FormSubmissionV2 {
  _id: string;
  studentId: string;
  studentName: string;
  questionnaireId: string;
  questionnaireTitle: string;
  answers: FormAnswerV2[];
  submittedAt: Date;
  completedBy?: string;
  status: 'draft' | 'completed' | 'reviewed';
  notes?: string;
  totalScore?: number;
  domainScores: DomainScore[];
  createdAt: Date;
  updatedAt: Date;
}

// UI State Management Interfaces
export interface FormBuilderState {
  questionnaire: {
    title: string;
    description: string;
    structure: FormNodeV2[];
    graphSettings: GraphSettings;
  };
  currentEditingNode: FormNodeV2 | null;
  expandedNodes: Set<string>;
  selectedNodePath: string[];
  validationErrors: string[];
  isDirty: boolean;
}

// Form Builder Action Types
export type FormBuilderAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'ADD_NODE'; payload: { parentPath: string[]; node: FormNodeV2 } }
  | { type: 'UPDATE_NODE'; payload: { nodePath: string[]; updates: Partial<FormNodeV2> } }
  | { type: 'DELETE_NODE'; payload: { nodePath: string[] } }
  | { type: 'MOVE_NODE'; payload: { fromPath: string[]; toPath: string[] } }
  | { type: 'SET_EDITING_NODE'; payload: FormNodeV2 | null }
  | { type: 'TOGGLE_NODE_EXPANSION'; payload: string }
  | { type: 'SET_VALIDATION_ERRORS'; payload: string[] }
  | { type: 'SET_GRAPH_SETTINGS'; payload: GraphSettings }
  | { type: 'RESET_FORM' };

// Node templates for quick creation
export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'group' | 'question';
  defaultNode: Partial<FormNodeV2>;
}

// API Response wrapper
export interface ApiResponseV2<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

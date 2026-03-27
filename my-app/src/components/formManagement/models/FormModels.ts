export interface FormSubmission {
  _id: string;
  formId: string;
  questionnaireId?: string;
  userId: string;
  answers: FormAnswer[];
  submittedAt?: Date;
  createdAt?: Date;
  status?: string;
  notes?: string;
  studentName?: string;
  questionnaireTitle?: string;
  completedBy?: string;
  totalScore?: number;
  domainScores?: Array<{ title: string; score: number; maxScore: number }>;
}

export interface FormAnswer {
  questionId: string;
  answer: string | number | string[];
  nodePath?: string | string[];
  selectedOptions?: Option[];
  questionTitle?: string;
  weight?: number;
  graphable?: boolean;
  inputType?: string;
}

export interface FormNode {
  id: string;
  type: string;
  label?: string;
  title?: string;
  weight?: number;
  description?: string;
  inputType?: 'single-choice' | 'multiple-choice' | 'scale' | 'number' | 'text';
  graphable?: boolean;
  required?: boolean;
  condition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  visibilityConditions?: VisibilityCondition[];
  options?: Option[];
  children?: FormNode[];
  preferredChartType?: 'bar' | 'line' | 'radar' | 'gauge' | 'pie';
  scaleMin?: number;
  scaleMax?: number;
}

export interface Option {
  id: string;
  label: string;
  value: number;
  children?: FormNode[];
}

export interface QuestionnaireTemplate {
  _id: string;
  title: string;
  description?: string;
  domains: DomainModel[];
  questions: QuestionModel[];
  structure?: FormNode[];
}

export interface QuestionnaireTemplateWithMetadata extends QuestionnaireTemplate {
  metadata: QuestionnaireMetadata;
  structure?: FormNode[];
  createdAt?: Date;
  createdBy?: string | { name: string };
  graphSettings?: GraphSettings;
  isActive?: boolean;
  version?: number;
}

export interface QuestionnaireMetadata {
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  totalQuestions?: number;
  totalNodes?: number;
  graphableQuestions?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface VisibilityCondition {
  questionId: string;
  optionId: string;
  value: string | number;
  operator?: string;
}

export type GraphSettings = {
  colorRanges: Array<{
    label: string;
    min: number;
    max: number;
    color: string;
  }>;
};

export interface DomainModel {
  _id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface OptionModel {
  id: string;
  value: number;
  label: string;
  subQuestions?: QuestionModel[];
}

export interface QuestionModel {
  _id: string;
  text: string;
  domainId: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'number' | 'scale';
  options: OptionModel[];
  required?: boolean;
  title?: string;
  weight?: number;
  helpText?: string;
  order: number;
  parentQuestionId?: string;
  parentOptionId?: string;
}

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

export interface CreateQuestionnaireRequest {
  title: string;
  description?: string;
  domains: Omit<DomainModel, '_id'>[];
  questions: Omit<QuestionModel, '_id' | 'options'>[] & {
    options: Omit<OptionModel, 'id' | 'subQuestions'>[] & {
      subQuestions?: Omit<QuestionModel, '_id'>[];
    };
  }[];
  structure?: FormNode[];
  graphSettings?: GraphSettings;
}

export type QuestionFormData = Omit<QuestionModel, '_id'>;

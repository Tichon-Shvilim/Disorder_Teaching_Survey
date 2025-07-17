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

// For creating questionnaires - just omit the _id fields
export interface CreateQuestionnaireRequest {
  title: string;
  description?: string;
  domains: Omit<DomainModel, '_id'>[];
  questions: Omit<QuestionModel, '_id' | 'options'>[] & {
    options: Omit<OptionModel, 'id' | 'subQuestions'>[] & {
      subQuestions?: Omit<QuestionModel, '_id'>[];
    };
  }[];
}

// Remove QuestionFormData entirely - just use QuestionModel without _id
export type QuestionFormData = Omit<QuestionModel, '_id'>;




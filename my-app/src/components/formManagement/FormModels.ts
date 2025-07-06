export interface DomainModel {
  _id: string;
  name: string;
  description?: string;
}

export interface OptionModel {
  value: number;
  label: string;
  subQuestionIds?: string[];
}

export interface QuestionModel {
  _id: string;
  text: string;
  domainId: string;
  options: OptionModel[];
}

export interface SubQuestionModel {
  _id: string;
  text: string;
  questionId: string;
  options: OptionModel[];
}




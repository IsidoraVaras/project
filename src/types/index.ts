export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: 'client' | 'admin';
  avatar?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating' | 'yes-no' | 'scale' | 'lsas';
  options?: QuestionOption[];
  required: boolean;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

export interface QuestionOption {
  label: string;
  value: number | string;
  orden?: number;
  group?: string; 
}


export interface Survey {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  createdAt: Date;
  isActive: boolean;
  author?: string;
  estimatedTime?: string;
}

export interface Answer {
  questionId: string;
  answer: string | number;
}

export interface SurveyTotals {
  total: number;
  subscales: Record<string, number>;
  classification?: string; 
  avg?: number; 
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  answers: Answer[];
  completedAt: Date;
  totals?: SurveyTotals;
}

export interface Category {
  id: string | number;
  nombre: string;
}

export interface AppState {
  currentUser: User | null;
  surveys: Survey[];
  responses: SurveyResponse[];
  users: User[];
}

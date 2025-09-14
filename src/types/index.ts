export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
  avatar?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'rating' | 'yes-no' | 'scale';
  options?: string[];
  required: boolean;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  category: 'psychosocial' | 'language-learning' | 'reading-comprehension';
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

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  answers: Answer[];
  completedAt: Date;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  surveysCount: number;
}

export interface AppState {
  currentUser: User | null;
  surveys: Survey[];
  responses: SurveyResponse[];
  users: User[];
}
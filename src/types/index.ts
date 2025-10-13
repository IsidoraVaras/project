// src/types/index.ts

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
  // CORRECCIÓN CLAVE: La propiedad 'category' ahora acepta cualquier string.
  // Esto es necesario porque le estamos asignando el ID de la categoría (ej., "1")
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

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  answers: Answer[];
  completedAt: Date;
}

export interface Category {
  // AJUSTE: El ID de la categoría debe aceptar string o number (DB es INT)
  id: string | number; 
  nombre: string;
}

export interface AppState {
  currentUser: User | null;
  surveys: Survey[];
  responses: SurveyResponse[];
  users: User[];
}
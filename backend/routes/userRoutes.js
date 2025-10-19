// backend/routes/userRoutes.js

import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';
import {
  getCategories,
  getSurveysByCategory,
  getQuestionsBySurvey,
} from '../controllers/surveyController.js';
import { getResponses, createResponse, getResultsByUser } from '../controllers/responseController.js';

const router = express.Router();

// Usuarios
router.post('/register', registerUser);
router.post('/login', loginUser);

// Encuestas y preguntas
router.get('/categories', getCategories);
router.get('/categories/:id/surveys', getSurveysByCategory);
router.get('/surveys/:id/questions', getQuestionsBySurvey);

// Respuestas
router.get('/responses', getResponses);
router.post('/responses', createResponse);
router.get('/users/:id/results', getResultsByUser);

export default router;

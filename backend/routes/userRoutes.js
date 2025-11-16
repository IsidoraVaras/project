import express from 'express';
import { registerUser, loginUser, listUsers, createAdminUser, deleteAdminUser } from '../controllers/userController.js';
import {
  getCategories,
  getSurveysByCategory,
  getQuestionsBySurvey,
  getAllSurveys,
} from '../controllers/surveyController.js';
import { getResponses, createResponse, getResultsByUser } from '../controllers/responseController.js';
import { exportResultPdf } from '../controllers/resultExportController.js';

const router = express.Router();

// Usuarios
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', listUsers);

// Crear admin 
router.post('/admin/users', createAdminUser);
router.delete('/admin/users/:id', deleteAdminUser);

// Encuestas y preguntas
router.get('/categories', getCategories);
router.get('/categories/:id/surveys', getSurveysByCategory);
router.get('/surveys/:id/questions', getQuestionsBySurvey);
router.get('/surveys', getAllSurveys);

// Respuestas
router.get('/responses', getResponses);
router.post('/responses', createResponse);
router.get('/users/:id/results', getResultsByUser);
router.get('/results/:id/export.pdf', exportResultPdf);

export default router;

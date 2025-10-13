// backend/routes/userRoutes.js

import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js'; 
import { 
    getCategories, 
    getSurveysByCategory, 
    getQuestionsBySurvey // <-- Importada
} from '../controllers/surveyController.js';     

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/categories', getCategories);
router.get('/categories/:id/surveys', getSurveysByCategory);

// --- RUTA AÑADIDA: Para obtener preguntas de una encuesta ---
router.get('/surveys/:id/questions', getQuestionsBySurvey);

export default router;
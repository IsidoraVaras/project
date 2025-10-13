// backend/routes/userRoutes.js

import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';
// Importa las funciones del controlador de encuestas
import { getCategories, getSurveysByCategory } from '../controllers/surveyController.js';     

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas de Categorías y Encuestas (Ahora gestionadas por este router)
router.get('/categories', getCategories);

// RUTA CLAVE: Para obtener encuestas por ID de categoría
// El frontend llama a: /api/categories/1/surveys. Como index.js usa app.use('/api', userRoutes), 
// aquí solo necesitamos '/categories/:id/surveys'
router.get('/categories/:id/surveys', getSurveysByCategory);

export default router;
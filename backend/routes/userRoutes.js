// backend/routes/userRoutes.js
import express from 'express';
import { registerUser, loginUser} from '../controllers/userController.js';
import { getCategories } from '../controllers/surveyController.js';     

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/categories', getCategories);

export default router;
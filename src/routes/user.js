import express from 'express';
import auth from '../middleware/auth.js';
import { getMe, updateMe } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);

export default router;

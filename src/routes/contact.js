import express from 'express';
import { sendContactEmail, getContactInfo } from '../controllers/contactController.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Send contact form email
// @access  Public
router.post('/', sendContactEmail);

// @route   GET /api/contact/info
// @desc    Get contact information
// @access  Public
router.get('/info', getContactInfo);

export default router;

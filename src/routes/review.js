import express from 'express';
import { 
  addReview, 
  getRecipeReviews, 
  updateReview, 
  deleteReview, 
  markHelpful, 
  getUserReviews 
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Add a review to a recipe
router.post('/:recipeId', authenticateToken, addReview);

// Get reviews for a recipe
router.get('/recipe/:recipeId', getRecipeReviews);

// Get user's reviews
router.get('/user/:userId', getUserReviews);

// Update a review
router.put('/:reviewId', authenticateToken, updateReview);

// Delete a review
router.delete('/:reviewId', authenticateToken, deleteReview);

// Mark review as helpful
router.post('/:reviewId/helpful', authenticateToken, markHelpful);

export default router;

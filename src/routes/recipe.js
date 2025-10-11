import express from 'express';
import auth from '../middleware/auth.js';
import {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleLikeRecipe,
  incrementViews,
  getPopularRecipes,
  getUserRecipes,
  rateRecipe
} from '../controllers/recipeController.js';

const router = express.Router();

// Public routes
router.get('/', getRecipes);
router.get('/popular', getPopularRecipes);
router.get('/user/:userId', getUserRecipes);
router.get('/:id', getRecipeById);
router.post('/:id/views', incrementViews);

// Protected routes
router.post('/', auth, createRecipe);
router.put('/:id', auth, updateRecipe);
router.delete('/:id', auth, deleteRecipe);
router.post('/:id/like', auth, toggleLikeRecipe);
router.post('/:id/rate', auth, rateRecipe);

export default router;

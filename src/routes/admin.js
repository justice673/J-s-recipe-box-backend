import express from 'express';
import { 
  getDashboardStats,
  getUsers,
  getRecipes,
  getReviews,
  updateUserStatus,
  deleteRecipe,
  deleteReviewAdmin,
  makeUserAdmin,
  requireAdmin
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/users', getUsers);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/admin', makeUserAdmin);

// Recipe management
router.get('/recipes', getRecipes);
router.delete('/recipes/:recipeId', deleteRecipe);

// Review management
router.get('/reviews', getReviews);
router.delete('/reviews/:reviewId', deleteReviewAdmin);

// Fix user roles (temporary endpoint)
router.post('/fix-user-roles', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Find users without proper role
    const usersWithoutRole = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' }
      ]
    });

    console.log(`Found ${usersWithoutRole.length} users without role`);

    // Update them to 'user' role
    const result = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: '' }
        ]
      },
      { $set: { role: 'user' } }
    );

    res.json({
      message: 'User roles fixed',
      usersFound: usersWithoutRole.length,
      usersUpdated: result.modifiedCount
    });
  } catch (error) {
    console.error('Error fixing user roles:', error);
    res.status(500).json({ message: 'Error fixing user roles', error: error.message });
  }
});

export default router;

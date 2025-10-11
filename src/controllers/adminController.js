import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import Review from '../models/Review.js';

// Check if user is admin middleware
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecipes = await Recipe.countDocuments();
    const totalReviews = await Review.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newRecipesThisMonth = await Recipe.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newReviewsThisMonth = await Review.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Top recipes by rating
    const topRecipes = await Recipe.find()
      .select('title averageRating reviewCount images')
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(5);

    // Recent users
    const recentUsers = await User.find()
      .select('fullName email createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent recipes
    const recentRecipes = await Recipe.find()
      .select('title category images createdAt')
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Chart data
    // User growth over last 6 months
    const userGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const userCount = await User.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      userGrowthData.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: userCount
      });
    }

    // Recipe categories distribution
    const recipeCategoriesData = await Recipe.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Ratings distribution
    const ratingsDistributionData = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $project: { rating: '$_id', count: 1, _id: 0 } },
      { $sort: { rating: 1 } }
    ]);

    // Monthly activity over last 6 months
    const monthlyActivityData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const recipeCount = await Recipe.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const reviewCount = await Review.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      monthlyActivityData.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        recipes: recipeCount,
        reviews: reviewCount
      });
    }

    res.json({
      stats: {
        totalUsers,
        totalRecipes,
        totalReviews,
        activeUsers,
        newUsersThisMonth,
        newRecipesThisMonth,
        newReviewsThisMonth
      },
      topRecipes,
      recentUsers,
      recentRecipes,
      charts: {
        userGrowth: userGrowthData,
        recipeCategories: recipeCategoriesData,
        ratingsDistribution: ratingsDistributionData,
        monthlyActivity: monthlyActivityData
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all users with pagination and search
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      if (role === 'user') {
        // Include users with role 'user' OR users without role field (they should be users by default)
        query.$or = [
          { role: 'user' },
          { role: { $exists: false } },
          { role: null },
          { role: '' }
        ];
      } else {
        query.role = role;
      }
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalUsers = await User.countDocuments(query);

    // Add recipe count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const recipeCount = await Recipe.countDocuments({ user: user._id });
        const reviewCount = await Review.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          recipeCount,
          reviewCount
        };
      })
    );

    res.json({
      users: usersWithStats,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all recipes with pagination and search
export const getRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const recipes = await Recipe.find(query)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalRecipes = await Recipe.countDocuments(query);

    res.json({
      recipes,
      totalRecipes,
      currentPage: page,
      totalPages: Math.ceil(totalRecipes / limit)
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all reviews with pagination and search
export const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', rating = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate('user', 'fullName email')
      .populate('recipe', 'title images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments(query);

    res.json({
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete recipe (admin)
export const deleteRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Delete all reviews for this recipe
    await Review.deleteMany({ recipe: recipeId });

    // Delete the recipe
    await Recipe.findByIdAndDelete(recipeId);

    res.json({ message: 'Recipe and associated reviews deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete review (admin)
export const deleteReviewAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const recipeId = review.recipe;
    
    // Remove review
    await Review.findByIdAndDelete(reviewId);

    // Update recipe stats
    const recipe = await Recipe.findById(recipeId);
    recipe.reviews.pull(reviewId);
    recipe.reviewCount -= 1;

    // Recalculate average rating
    const remainingReviews = await Review.find({ recipe: recipeId });
    if (remainingReviews.length > 0) {
      const totalRating = remainingReviews.reduce((sum, review) => sum + review.rating, 0);
      recipe.averageRating = totalRating / remainingReviews.length;
      recipe.ratingCount = remainingReviews.length;
    } else {
      recipe.averageRating = 0;
      recipe.ratingCount = 0;
    }

    await recipe.save();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Make user admin
export const makeUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

import Review from '../models/Review.js';
import Recipe from '../models/Recipe.js';
import User from '../models/User.js';

// Add a review
export const addReview = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed this recipe
    const existingReview = await Review.findOne({ user: userId, recipe: recipeId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this recipe' });
    }

    // Create review
    const review = new Review({
      user: userId,
      recipe: recipeId,
      rating,
      comment
    });

    await review.save();

    // Update recipe with review reference and recalculate average rating
    const recipe = await Recipe.findById(recipeId);
    recipe.reviews.push(review._id);
    recipe.reviewCount += 1;

    // Recalculate average rating
    const allReviews = await Review.find({ recipe: recipeId });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    recipe.averageRating = totalRating / allReviews.length;
    recipe.ratingCount = allReviews.length;

    await recipe.save();

    // Populate user data for response
    await review.populate('user', 'fullName avatar');

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get reviews for a recipe
export const getRecipeReviews = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const reviews = await Review.find({ recipe: recipeId })
      .populate('user', 'fullName avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({ recipe: recipeId });

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

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Recalculate recipe average rating
    const recipe = await Recipe.findById(review.recipe);
    const allReviews = await Review.find({ recipe: review.recipe });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    recipe.averageRating = totalRating / allReviews.length;
    await recipe.save();

    await review.populate('user', 'fullName avatar');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const recipeId = review.recipe;
    
    // Remove review
    await Review.findByIdAndDelete(reviewId);

    // Update recipe
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

// Mark review as helpful
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const alreadyMarked = review.helpfulBy.includes(userId);
    
    if (alreadyMarked) {
      // Remove helpful mark
      review.helpfulBy.pull(userId);
      review.helpful -= 1;
    } else {
      // Add helpful mark
      review.helpfulBy.push(userId);
      review.helpful += 1;
    }

    await review.save();

    res.json({
      message: alreadyMarked ? 'Helpful mark removed' : 'Marked as helpful',
      helpful: review.helpful,
      isMarkedHelpful: !alreadyMarked
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: userId })
      .populate('recipe', 'title images category')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments({ user: userId });

    res.json({
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

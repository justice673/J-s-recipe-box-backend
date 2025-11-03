import Recipe from '../models/Recipe.js';
import User from '../models/User.js';

// Helper function to normalize images array
const normalizeRecipeImages = (recipe) => {
  const recipeObj = recipe.toObject ? recipe.toObject() : recipe;
  // If images array is empty but image field exists, populate images array
  if ((!recipeObj.images || recipeObj.images.length === 0) && recipeObj.image) {
    recipeObj.images = [recipeObj.image];
  }
  return recipeObj;
};

// Create a new recipe
export const createRecipe = async (req, res) => {
  try {
    const recipeData = req.body;
    recipeData.user = req.user.id; // Set user from auth middleware
    
    // Ensure backward compatibility with single image
    if (recipeData.images && recipeData.images.length > 0) {
      recipeData.image = recipeData.images[0]; // Set primary image for compatibility
    }
    
    const recipe = new Recipe(recipeData);
    await recipe.save();
    const normalizedRecipe = normalizeRecipeImages(recipe);
    res.status(201).json({ message: 'Recipe created successfully.', recipe: normalizedRecipe });
  } catch (err) {
    console.error('Create recipe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all recipes (with search and filters)
export const getRecipes = async (req, res) => {
  try {
    const { search, category, cuisine, diet, difficulty, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }
    if (category) query.category = category;
    if (cuisine) query.cuisine = cuisine;
    if (diet) query.diet = diet;
    if (difficulty) query.difficulty = difficulty;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Recipe.countDocuments(query);
    const recipes = await Recipe.find(query)
      .populate('user', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    // Normalize images array for all recipes
    const normalizedRecipes = recipes.map(normalizeRecipeImages);
    res.json({ recipes: normalizedRecipes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get recipes error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get a single recipe by ID
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('user', 'fullName email');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found.' });
    const normalizedRecipe = normalizeRecipeImages(recipe);
    res.json(normalizedRecipe);
  } catch (err) {
    console.error('Get recipe by ID error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update a recipe
export const updateRecipe = async (req, res) => {
  try {
    const updateData = req.body;
    
    // Ensure backward compatibility with single image
    if (updateData.images && updateData.images.length > 0) {
      updateData.image = updateData.images[0]; // Set primary image for compatibility
    }
    
    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateData,
      { new: true }
    );
    if (!recipe) return res.status(404).json({ message: 'Recipe not found or unauthorized.' });
    const normalizedRecipe = normalizeRecipeImages(recipe);
    res.json({ message: 'Recipe updated.', recipe: normalizedRecipe });
  } catch (err) {
    console.error('Update recipe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a recipe
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!recipe) return res.status(404).json({ message: 'Recipe not found or unauthorized.' });
    res.json({ message: 'Recipe deleted.' });
  } catch (err) {
    console.error('Delete recipe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Like or unlike a recipe
export const toggleLikeRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found.' });
    const userId = req.user.id;
    const liked = recipe.likedBy.includes(userId);
    if (liked) {
      recipe.likedBy.pull(userId);
      recipe.likes = Math.max(0, recipe.likes - 1);
    } else {
      recipe.likedBy.push(userId);
      recipe.likes += 1;
    }
    await recipe.save();
    res.json({ message: liked ? 'Unliked' : 'Liked', likes: recipe.likes });
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Increment recipe views
export const incrementViews = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!recipe) return res.status(404).json({ message: 'Recipe not found.' });
    res.json({ views: recipe.views });
  } catch (err) {
    console.error('Increment views error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get popular recipes (by likes or views)
export const getPopularRecipes = async (req, res) => {
  try {
    const { by = 'likes', limit = 10 } = req.query;
    const sortField = by === 'views' ? 'views' : 'likes';
    const recipes = await Recipe.find()
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .populate('user', 'fullName email');
    const normalizedRecipes = recipes.map(normalizeRecipeImages);
    res.json(normalizedRecipes);
  } catch (err) {
    console.error('Get popular recipes error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all recipes by a user
export const getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ user: req.params.userId }).populate('user', 'fullName email');
    const normalizedRecipes = recipes.map(normalizeRecipeImages);
    res.json(normalizedRecipes);
  } catch (err) {
    console.error('Get user recipes error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Add after toggleLikeRecipe
export const rateRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    // Update or add rating in Recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found.' });
    const existingRecipeRating = recipe.ratings.find(r => r.user.toString() === userId);
    if (existingRecipeRating) {
      existingRecipeRating.rating = rating;
    } else {
      recipe.ratings.push({ user: userId, rating });
      recipe.ratingCount += 1;
    }
    // Recalculate average
    recipe.averageRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length;
    await recipe.save();
    // Update or add rating in User
    const user = await User.findById(userId);
    const existingUserRating = user.ratings.find(r => r.recipe.toString() === recipeId);
    if (existingUserRating) {
      existingUserRating.rating = rating;
    } else {
      user.ratings.push({ recipe: recipeId, rating });
    }
    await user.save();
    res.json({ message: 'Rating submitted.', averageRating: recipe.averageRating, ratingCount: recipe.ratingCount });
  } catch (err) {
    console.error('Rate recipe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

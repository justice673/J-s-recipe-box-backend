import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../src/models/Recipe.js';

dotenv.config();

const recipeId = '68d5e996e92db1861b260699';
// For Next.js, images in public folder are served from root path
const newImageUrl = '/Vegan-Creamy-Pasta-Primavera_done.png';

async function updateRecipeImage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Find and update the recipe
    const recipe = await Recipe.findById(recipeId);
    
    if (!recipe) {
      console.error('Recipe not found with ID:', recipeId);
      process.exit(1);
    }

    // Update the image
    recipe.image = newImageUrl;
    
    // Update images array - set first element or create array with one element
    if (recipe.images && recipe.images.length > 0) {
      recipe.images[0] = newImageUrl;
    } else {
      recipe.images = [newImageUrl];
    }
    
    await recipe.save();

    console.log('Recipe updated successfully!');
    console.log('Recipe title:', recipe.title);
    console.log('New image URL:', recipe.image);
    process.exit(0);
  } catch (error) {
    console.error('Error updating recipe:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

updateRecipeImage();


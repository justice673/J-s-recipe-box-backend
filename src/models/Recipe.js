import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }, // Primary image for backward compatibility
  images: [{ type: String }], // Array of all images
  prepTime: { type: Number, required: true },
  difficulty: { type: String, required: true },
  category: { type: String, required: true },
  cuisine: { type: String, required: true },
  diet: { type: String, required: true },
  serves: { type: Number, required: true },
  calories: { type: Number },
  ingredients: [{ type: String, required: true }],
  instructions: [{ type: String, required: true }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 }
    }
  ],
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
  }],
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Recipe', recipeSchema);

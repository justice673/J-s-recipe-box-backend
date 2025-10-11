import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipe: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recipe', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true,
    maxLength: 1000
  },
  helpful: { 
    type: Number, 
    default: 0 
  },
  helpfulBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { timestamps: true });

// Ensure one review per user per recipe
reviewSchema.index({ user: 1, recipe: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);

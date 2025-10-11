import User from '../models/User.js';
import Recipe from '../models/Recipe.js';

// Get current user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    // Count recipes liked by this user
    const totalFavorites = await Recipe.countDocuments({ likedBy: user._id });
    const userObj = user.toObject();
    userObj.totalFavorites = totalFavorites;
    res.json(userObj);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update current user profile
export const updateMe = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent email change to an existing email
    if (updates.email) {
      const existing = await User.findOne({ email: updates.email });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

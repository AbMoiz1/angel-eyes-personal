const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, firstName, lastName, phoneNumber } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber: phoneNumber || undefined
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user account'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Check if user exists and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('babies')
      .select('-password');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          babies: user.babies
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (mainly for clearing device tokens)
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (deviceToken) {
      // Remove device token from user
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { deviceTokens: { token: deviceToken } }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
});

// @route   POST /api/auth/device-token
// @desc    Register device token for push notifications
// @access  Private
router.post('/device-token', authMiddleware, async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Token and platform are required'
      });
    }

    // Remove existing token if it exists
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { deviceTokens: { token } }
    });

    // Add new token
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        deviceTokens: {
          token,
          platform,
          addedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Device token registered successfully'
    });
  } catch (error) {
    console.error('Device token registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device token'
    });
  }
});

// @route   DELETE /api/auth/device-token
// @desc    Remove device token
// @access  Private
router.delete('/device-token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { deviceTokens: { token } }
    });

    res.json({
      success: true,
      message: 'Device token removed successfully'
    });
  } catch (error) {
    console.error('Device token removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing device token'
    });
  }
});

module.exports = router;

const express = require('express');
const Joi = require('joi');
const User = require('../models/User');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  preferences: Joi.object({
    notifications: Joi.object({
      safetyAlerts: Joi.boolean().optional(),
      routineReminders: Joi.boolean().optional(),
      communityUpdates: Joi.boolean().optional(),
      emailNotifications: Joi.boolean().optional(),
      pushNotifications: Joi.boolean().optional()
    }).optional(),
    privacy: Joi.object({
      shareDataForImprovement: Joi.boolean().optional(),
      allowCommunityInteraction: Joi.boolean().optional()
    }).optional()
  }).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res) => {
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

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const user = await User.findById(req.user._id);

    // Update user fields
    Object.assign(user, value);

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          preferences: user.preferences,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = value;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to deactivate account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating account'
    });
  }
});

// @route   GET /api/users/dashboard-stats
// @desc    Get dashboard statistics for user
// @access  Private
router.get('/dashboard-stats', async (req, res) => {
  try {
    const Baby = require('../models/Baby');
    const MonitoringSession = require('../models/MonitoringSession');
    const Detection = require('../models/Detection');

    // Get user's babies
    const babies = await Baby.find({
      $or: [
        { parents: req.user._id },
        { 'caregivers.user': req.user._id }
      ],
      isActive: true
    });

    const babyIds = babies.map(baby => baby._id);

    // Get recent monitoring sessions
    const recentSessions = await MonitoringSession.find({
      babyId: { $in: babyIds }
    })
    .sort({ startTime: -1 })
    .limit(5)
    .populate('babyId', 'name profilePicture')
    .populate('startedBy', 'firstName lastName');

    // Get recent detections
    const recentDetections = await Detection.find({
      babyId: { $in: babyIds }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('babyId', 'name profilePicture');

    // Get active sessions count
    const activeSessions = await MonitoringSession.countDocuments({
      babyId: { $in: babyIds },
      status: 'Active'
    });

    // Get critical detections in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const criticalDetections = await Detection.countDocuments({
      babyId: { $in: babyIds },
      severity: 'Critical',
      timestamp: { $gte: yesterday }
    });

    // Get unread alerts count
    const unreadAlerts = await Detection.countDocuments({
      babyId: { $in: babyIds },
      status: 'New'
    });

    res.json({
      success: true,
      data: {
        statistics: {
          totalBabies: babies.length,
          activeSessions,
          criticalDetections,
          unreadAlerts
        },
        recentSessions: recentSessions.map(session => ({
          id: session._id,
          baby: session.babyId,
          startedBy: session.startedBy,
          startTime: session.startTime,
          duration: session.duration,
          status: session.status,
          sessionType: session.sessionType
        })),
        recentDetections: recentDetections.map(detection => ({
          id: detection._id,
          baby: detection.babyId,
          type: detection.detectionType,
          severity: detection.severity,
          timestamp: detection.timestamp,
          status: detection.status,
          confidence: detection.confidence
        })),
        babies: babies.map(baby => ({
          id: baby._id,
          name: baby.name,
          ageInMonths: baby.ageInMonths,
          profilePicture: baby.profilePicture,
          permissions: baby.getUserPermissions(req.user._id)
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

module.exports = router;

const express = require('express');
const Joi = require('joi');
const Baby = require('../models/Baby');
const User = require('../models/User');

const router = express.Router();

// Validation schemas
const createBabySchema = Joi.object({
  name: Joi.string().max(100).required(),
  dateOfBirth: Joi.alternatives().try(
    Joi.date().max('now').required(),
    Joi.string().isoDate().required()
  ),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'male', 'female', 'other').required(),
  height: Joi.number().min(20).max(150).required(),
  weight: Joi.number().min(0.5).max(30).required(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown').optional(),
  allergies: Joi.array().items(Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('Mild', 'Moderate', 'Severe').default('Mild'),
    notes: Joi.string().optional()
  })).optional(),
  emergencyContacts: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().optional(),
    isPrimary: Joi.boolean().default(false)
  })).optional(),
  doctor: Joi.object({
    name: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    email: Joi.string().email().optional(),
    clinic: Joi.string().optional(),
    address: Joi.string().optional()
  }).optional(),
  feedingSettings: Joi.object({
    feedingType: Joi.string().valid('Breastfeeding', 'Formula', 'Mixed', 'Solid').required(),
    feedingSchedule: Joi.array().items(Joi.object({
      time: Joi.string().optional(),
      amount: Joi.number().optional(),
      type: Joi.string().optional()
    })).optional(),
    allergens: Joi.array().items(Joi.string()).optional(),
    preferences: Joi.array().items(Joi.string()).optional()
  }).optional(),
  sleepSettings: Joi.object({
    bedtime: Joi.string().default('20:00'),
    wakeupTime: Joi.string().default('07:00'),
    napTimes: Joi.array().items(Joi.object({
      startTime: Joi.string().optional(),
      duration: Joi.number().optional()
    })).optional(),
    sleepTrainingMethod: Joi.string().valid('Ferber', 'CryItOut', 'NoCryItOut', 'Chair', 'Other', 'None').default('None')
  }).optional()
});

const updateBabySchema = Joi.object({
  name: Joi.string().max(100).optional(),
  height: Joi.number().min(20).max(150).optional(),
  weight: Joi.number().min(0.5).max(30).optional(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown').optional(),
  allergies: Joi.array().items(Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('Mild', 'Moderate', 'Severe').default('Mild'),
    notes: Joi.string().optional()
  })).optional(),
  emergencyContacts: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().optional(),
    isPrimary: Joi.boolean().default(false)
  })).optional(),
  doctor: Joi.object({
    name: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    email: Joi.string().email().optional(),
    clinic: Joi.string().optional(),
    address: Joi.string().optional()
  }).optional(),
  feedingSettings: Joi.object({
    feedingType: Joi.string().valid('Breastfeeding', 'Formula', 'Mixed', 'Solid').optional(),
    feedingSchedule: Joi.array().items(Joi.object({
      time: Joi.string().optional(),
      amount: Joi.number().optional(),
      type: Joi.string().optional()
    })).optional(),
    allergens: Joi.array().items(Joi.string()).optional(),
    preferences: Joi.array().items(Joi.string()).optional()
  }).optional(),
  sleepSettings: Joi.object({
    bedtime: Joi.string().optional(),
    wakeupTime: Joi.string().optional(),
    napTimes: Joi.array().items(Joi.object({
      startTime: Joi.string().optional(),
      duration: Joi.number().optional()
    })).optional(),
    sleepTrainingMethod: Joi.string().valid('Ferber', 'CryItOut', 'NoCryItOut', 'Chair', 'Other', 'None').optional()
  }).optional()
});

// @route   POST /api/babies
// @desc    Create a new baby profile
// @access  Private
router.post('/', async (req, res) => {
  try {
    console.log('📝 Baby creation request body:', req.body); // Debug log
    
    // Validate request body
    const { error, value } = createBabySchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message); // Debug log
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    console.log('✅ Validation passed:', value); // Debug log

    // Ensure only one primary emergency contact
    if (value.emergencyContacts) {
      const primaryContacts = value.emergencyContacts.filter(contact => contact.isPrimary);
      if (primaryContacts.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Only one emergency contact can be primary'
        });
      }    }

    // Process and normalize the data
    const processedData = {
      ...value,
      dateOfBirth: new Date(value.dateOfBirth),
      gender: value.gender.charAt(0).toUpperCase() + value.gender.slice(1).toLowerCase(), // Normalize gender
      parents: [req.user._id]
    };

    console.log('🔄 Processed data:', processedData); // Debug log

    // Create baby with current user as parent
    const baby = new Baby(processedData);

    await baby.save();

    // Populate the baby data
    await baby.populate('parents', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Baby profile created successfully',
      data: {
        baby: {
          id: baby._id,
          name: baby.name,
          dateOfBirth: baby.dateOfBirth,
          gender: baby.gender,
          height: baby.height,
          weight: baby.weight,
          bloodType: baby.bloodType,
          ageInMonths: baby.ageInMonths,
          ageInDays: baby.ageInDays,
          allergies: baby.allergies,
          emergencyContacts: baby.emergencyContacts,
          doctor: baby.doctor,
          parents: baby.parents,
          createdAt: baby.createdAt
        }
      }
    });  } catch (error) {
    console.error('❌ Create baby error:', error.message); // Enhanced error logging
    console.error('❌ Full error:', error); // Full error details
    res.status(500).json({
      success: false,
      message: 'Error creating baby profile',
      error: error.message // Include error message in response for debugging
    });
  }
});

// @route   GET /api/babies
// @desc    Get all babies for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const babies = await Baby.find({
      $or: [
        { parents: req.user._id },
        { 'caregivers.user': req.user._id }
      ],
      isActive: true
    })
    .populate('parents', 'firstName lastName email')
    .populate('caregivers.user', 'firstName lastName email')
    .sort({ createdAt: -1 });

    // Add permissions for each baby
    const babiesWithPermissions = babies.map(baby => ({
      id: baby._id,
      name: baby.name,
      dateOfBirth: baby.dateOfBirth,
      gender: baby.gender,
      height: baby.height,
      weight: baby.weight,
      bloodType: baby.bloodType,
      ageInMonths: baby.ageInMonths,
      ageInDays: baby.ageInDays,
      profilePicture: baby.profilePicture,
      allergies: baby.allergies,
      emergencyContacts: baby.emergencyContacts,
      doctor: baby.doctor,
      parents: baby.parents,
      caregivers: baby.caregivers,
      permissions: baby.getUserPermissions(req.user._id),
      createdAt: baby.createdAt,
      updatedAt: baby.updatedAt
    }));

    res.json({
      success: true,
      data: {
        babies: babiesWithPermissions,
        count: babiesWithPermissions.length
      }
    });
  } catch (error) {
    console.error('Get babies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching baby profiles'
    });
  }
});

// @route   GET /api/babies/:id
// @desc    Get single baby by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id)
      .populate('parents', 'firstName lastName email phoneNumber')
      .populate('caregivers.user', 'firstName lastName email phoneNumber')
      .populate('milestones.recordedBy', 'firstName lastName');

    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby profile not found'
      });
    }

    // Check if user has access to this baby
    if (!baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this baby profile'
      });
    }

    res.json({
      success: true,
      data: {
        baby: {
          id: baby._id,
          name: baby.name,
          dateOfBirth: baby.dateOfBirth,
          gender: baby.gender,
          height: baby.height,
          weight: baby.weight,
          bloodType: baby.bloodType,
          ageInMonths: baby.ageInMonths,
          ageInDays: baby.ageInDays,
          profilePicture: baby.profilePicture,
          allergies: baby.allergies,
          medicalConditions: baby.medicalConditions,
          emergencyContacts: baby.emergencyContacts,
          doctor: baby.doctor,
          parents: baby.parents,
          caregivers: baby.caregivers,
          milestones: baby.milestones,
          sleepSettings: baby.sleepSettings,
          feedingSettings: baby.feedingSettings,
          permissions: baby.getUserPermissions(req.user._id),
          createdAt: baby.createdAt,
          updatedAt: baby.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get baby error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching baby profile'
    });
  }
});

// @route   PUT /api/babies/:id
// @desc    Update baby profile
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateBabySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const baby = await Baby.findById(req.params.id);

    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby profile not found'
      });
    }

    // Check if user has edit permissions
    const permissions = baby.getUserPermissions(req.user._id);
    if (!permissions.editProfile) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this profile'
      });
    }

    // Ensure only one primary emergency contact
    if (value.emergencyContacts) {
      const primaryContacts = value.emergencyContacts.filter(contact => contact.isPrimary);
      if (primaryContacts.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Only one emergency contact can be primary'
        });
      }
    }

    // Update baby profile
    Object.assign(baby, value);
    await baby.save();

    // Populate updated data
    await baby.populate('parents', 'firstName lastName email');
    await baby.populate('caregivers.user', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Baby profile updated successfully',
      data: {
        baby: {
          id: baby._id,
          name: baby.name,
          dateOfBirth: baby.dateOfBirth,
          gender: baby.gender,
          height: baby.height,
          weight: baby.weight,
          bloodType: baby.bloodType,
          ageInMonths: baby.ageInMonths,
          ageInDays: baby.ageInDays,
          allergies: baby.allergies,
          emergencyContacts: baby.emergencyContacts,
          doctor: baby.doctor,
          parents: baby.parents,
          caregivers: baby.caregivers,
          updatedAt: baby.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update baby error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating baby profile'
    });
  }
});

// @route   DELETE /api/babies/:id
// @desc    Delete (deactivate) baby profile
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id);

    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby profile not found'
      });
    }

    // Only parents can delete baby profiles
    if (!baby.parents.some(parentId => parentId.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Only parents can delete baby profiles'
      });
    }

    // Soft delete - set isActive to false
    baby.isActive = false;
    await baby.save();

    res.json({
      success: true,
      message: 'Baby profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete baby error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting baby profile'
    });
  }
});

// @route   POST /api/babies/:id/milestones
// @desc    Add milestone to baby
// @access  Private
router.post('/:id/milestones', async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id);

    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby profile not found'
      });
    }

    // Check access
    if (!baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this baby profile'
      });
    }

    const { type, title, description, achievedDate, expectedAgeRange, notes } = req.body;

    if (!type || !title || !achievedDate) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and achieved date are required'
      });
    }

    baby.milestones.push({
      type,
      title,
      description,
      achievedDate: new Date(achievedDate),
      expectedAgeRange,
      notes,
      recordedBy: req.user._id
    });

    await baby.save();

    res.json({
      success: true,
      message: 'Milestone added successfully',
      data: {
        milestone: baby.milestones[baby.milestones.length - 1]
      }
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding milestone'
    });
  }
});

// @route   GET /api/babies/:id/statistics
// @desc    Get baby statistics
// @access  Private
router.get('/:id/statistics', async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id);

    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby profile not found'
      });
    }

    // Check access
    if (!baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this baby profile'
      });
    }

    // Basic statistics
    const stats = {
      ageInDays: baby.ageInDays,
      ageInMonths: baby.ageInMonths,
      totalMilestones: baby.milestones.length,
      milestonesByType: {},
      recentMilestones: baby.milestones.slice(-5).reverse(),
      emergencyContactsCount: baby.emergencyContacts.length,
      allergiesCount: baby.allergies.length,
      medicalConditionsCount: baby.medicalConditions.length
    };

    // Group milestones by type
    baby.milestones.forEach(milestone => {
      stats.milestonesByType[milestone.type] = (stats.milestonesByType[milestone.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get baby statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching baby statistics'
    });
  }
});

module.exports = router;

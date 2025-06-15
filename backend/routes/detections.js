const express = require('express');
const Joi = require('joi');
const Detection = require('../models/Detection');
const MonitoringSession = require('../models/MonitoringSession');
const Baby = require('../models/Baby');

const router = express.Router();

// Validation schemas
const createDetectionSchema = Joi.object({
  babyId: Joi.string().required(),
  sessionId: Joi.string().required(),
  detectionType: Joi.string().valid(
    'Choking', 'UnsafeSleeping', 'ExcessiveCrying', 'MotionDetection',
    'SoundDetection', 'TemperatureAnomaly', 'FallDetection', 'UnusualPosition',
    'FaceRecognition', 'NoMovement'
  ).required(),
  severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
  confidence: Joi.number().min(0).max(1).required(),
  data: Joi.object({
    imageUrl: Joi.string().optional(),
    videoUrl: Joi.string().optional(),
    thumbnailUrl: Joi.string().optional(),
    motionLevel: Joi.number().min(0).max(100).optional(),
    motionArea: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      width: Joi.number().required(),
      height: Joi.number().required()
    }).optional(),
    soundLevel: Joi.number().min(0).max(100).optional(),
    soundType: Joi.string().valid('Crying', 'Coughing', 'Choking', 'Normal', 'Silence', 'Other').optional(),
    bodyPosition: Joi.string().valid('Back', 'Stomach', 'Side', 'Sitting', 'Unknown').optional(),
    headPosition: Joi.string().valid('Up', 'Down', 'Left', 'Right', 'Unknown').optional(),
    heartRate: Joi.number().optional(),
    breathingRate: Joi.number().optional(),
    bodyTemperature: Joi.number().optional(),
    rawData: Joi.any().optional(),
    processingTime: Joi.number().optional(),
    modelVersion: Joi.string().optional(),
    deviceInfo: Joi.object({
      camera: Joi.string().optional(),
      resolution: Joi.string().optional(),
      fps: Joi.number().optional()
    }).optional()
  }).optional()
});

// @route   POST /api/detections
// @desc    Create a new detection (usually from AI/ML service)
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createDetectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { babyId, sessionId, detectionType, severity, confidence, data } = value;

    // Verify baby exists and user has access
    const baby = await Baby.findById(babyId);
    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby not found'
      });
    }

    if (!baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this baby'
      });
    }

    // Verify session exists and is active
    const session = await MonitoringSession.findById(sessionId);
    if (!session || session.babyId.toString() !== babyId) {
      return res.status(404).json({
        success: false,
        message: 'Monitoring session not found or does not belong to this baby'
      });
    }

    // Create detection
    const detection = new Detection({
      babyId,
      sessionId,
      detectionType,
      severity,
      confidence,
      data: data || {}
    });

    await detection.save();

    // Add detection to session
    session.detections.push(detection._id);
    session.statistics.totalDetections += 1;

    // Update session statistics based on detection type
    if (detectionType === 'MotionDetection') {
      session.statistics.movementEvents += 1;
      if (data && data.motionLevel) {
        session.statistics.averageMotionLevel = 
          (session.statistics.averageMotionLevel + data.motionLevel) / 2;
      }
    }

    if (detectionType === 'SoundDetection') {
      session.statistics.soundEvents += 1;
      if (data && data.soundLevel) {
        session.statistics.averageSoundLevel = 
          (session.statistics.averageSoundLevel + data.soundLevel) / 2;
      }
    }

    if (severity === 'Critical' || severity === 'High') {
      session.statistics.safetyIncidents += 1;
    }

    await session.save();

    // Get users to notify (parents and caregivers with alert permissions)
    const usersToNotify = [];
    
    // Add parents
    for (const parentId of baby.parents) {
      usersToNotify.push(parentId);
    }

    // Add caregivers with alert permissions
    for (const caregiver of baby.caregivers) {
      if (caregiver.permissions.receiveAlerts && caregiver.user) {
        usersToNotify.push(caregiver.user);
      }
    }

    // Send alerts to relevant users
    for (const userId of usersToNotify) {
      await detection.addAlert(userId, 'Push');
    }

    // Emit real-time alert if severity is high or critical
    if (severity === 'High' || severity === 'Critical') {
      const io = req.app.get('io');
      if (io) {
        io.to(`baby-${babyId}`).emit('safety-alert', {
          detectionId: detection._id,
          type: detectionType,
          severity,
          message: `${detectionType} detected with ${severity.toLowerCase()} severity`,
          timestamp: detection.timestamp,
          babyId,
          confidence,
          data: data || {}
        });
      }

      // Add alert to session
      await session.addAlert({
        type: 'Safety',
        severity,
        message: `${detectionType} detected`,
        metadata: {
          detectionId: detection._id,
          confidence,
          detectionType
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Detection created successfully',
      data: {
        detection: {
          id: detection._id,
          babyId: detection.babyId,
          sessionId: detection.sessionId,
          detectionType: detection.detectionType,
          severity: detection.severity,
          confidence: detection.confidence,
          timestamp: detection.timestamp,
          status: detection.status,
          data: detection.data
        }
      }
    });
  } catch (error) {
    console.error('Create detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating detection'
    });
  }
});

// @route   GET /api/detections
// @desc    Get detections for user's babies
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      babyId, 
      sessionId, 
      detectionType, 
      severity, 
      status, 
      limit = 20, 
      page = 1,
      startDate,
      endDate
    } = req.query;

    // Get user's babies
    const babies = await Baby.find({
      $or: [
        { parents: req.user._id },
        { 'caregivers.user': req.user._id }
      ],
      isActive: true
    });

    const babyIds = babies.map(baby => baby._id);

    // Build query
    const query = { babyId: { $in: babyIds } };
    
    if (babyId) {
      // Verify access to specific baby
      if (!babyIds.some(id => id.toString() === babyId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this baby'
        });
      }
      query.babyId = babyId;
    }

    if (sessionId) query.sessionId = sessionId;
    if (detectionType) query.detectionType = detectionType;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const detections = await Detection.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('babyId', 'name profilePicture')
      .populate('sessionId', 'sessionType startTime')
      .populate('resolvedBy', 'firstName lastName');

    const total = await Detection.countDocuments(query);

    res.json({
      success: true,
      data: {
        detections: detections.map(detection => ({
          id: detection._id,
          baby: detection.babyId,
          session: detection.sessionId,
          detectionType: detection.detectionType,
          severity: detection.severity,
          severityColor: detection.severityColor,
          confidence: detection.confidence,
          timestamp: detection.timestamp,
          timeSince: detection.timeSince,
          status: detection.status,
          data: detection.data,
          unreadAlerts: detection.unreadAlerts.length,
          resolvedBy: detection.resolvedBy,
          resolvedAt: detection.resolvedAt,
          isFalsePositive: detection.isFalsePositive
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get detections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detections'
    });
  }
});

// @route   GET /api/detections/:id
// @desc    Get single detection details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id)
      .populate('babyId', 'name profilePicture')
      .populate('sessionId', 'sessionType startTime endTime')
      .populate('alerts.sentTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .populate('userFeedback.providedBy', 'firstName lastName')
      .populate('escalatedTo.user', 'firstName lastName email')
      .populate('relatedDetections');

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    // Verify baby access
    const baby = await Baby.findById(detection.babyId);
    if (!baby || !baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this detection'
      });
    }

    res.json({
      success: true,
      data: {
        detection: {
          id: detection._id,
          baby: detection.babyId,
          session: detection.sessionId,
          detectionType: detection.detectionType,
          severity: detection.severity,
          severityColor: detection.severityColor,
          confidence: detection.confidence,
          timestamp: detection.timestamp,
          timeSince: detection.timeSince,
          status: detection.status,
          data: detection.data,
          alerts: detection.alerts,
          resolvedBy: detection.resolvedBy,
          resolvedAt: detection.resolvedAt,
          resolutionNotes: detection.resolutionNotes,
          isFalsePositive: detection.isFalsePositive,
          falsePositiveReason: detection.falsePositiveReason,
          userFeedback: detection.userFeedback,
          relatedDetections: detection.relatedDetections,
          escalationLevel: detection.escalationLevel,
          escalatedTo: detection.escalatedTo,
          createdAt: detection.createdAt,
          updatedAt: detection.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detection'
    });
  }
});

// @route   PUT /api/detections/:id/acknowledge
// @desc    Acknowledge a detection alert
// @access  Private
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { alertId, action } = req.body;

    if (!alertId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Alert ID and action are required'
      });
    }

    const detection = await Detection.findById(req.params.id);

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    // Verify baby access
    const baby = await Baby.findById(detection.babyId);
    if (!baby || !baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this detection'
      });
    }

    await detection.acknowledgeAlert(alertId, action);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Acknowledge detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging detection'
    });
  }
});

// @route   PUT /api/detections/:id/resolve
// @desc    Resolve a detection
// @access  Private
router.put('/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;

    const detection = await Detection.findById(req.params.id);

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    // Verify baby access
    const baby = await Baby.findById(detection.babyId);
    if (!baby || !baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this detection'
      });
    }

    await detection.resolve(req.user._id, notes);

    res.json({
      success: true,
      message: 'Detection resolved successfully',
      data: {
        detection: {
          id: detection._id,
          status: detection.status,
          resolvedAt: detection.resolvedAt,
          resolutionNotes: detection.resolutionNotes
        }
      }
    });
  } catch (error) {
    console.error('Resolve detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving detection'
    });
  }
});

// @route   PUT /api/detections/:id/false-positive
// @desc    Mark detection as false positive
// @access  Private
router.put('/:id/false-positive', async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for marking as false positive'
      });
    }

    const detection = await Detection.findById(req.params.id);

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    // Verify baby access
    const baby = await Baby.findById(detection.babyId);
    if (!baby || !baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this detection'
      });
    }

    await detection.markAsFalsePositive(reason, req.user._id);

    res.json({
      success: true,
      message: 'Detection marked as false positive successfully',
      data: {
        detection: {
          id: detection._id,
          isFalsePositive: detection.isFalsePositive,
          falsePositiveReason: detection.falsePositiveReason,
          status: detection.status
        }
      }
    });
  } catch (error) {
    console.error('Mark false positive error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking detection as false positive'
    });
  }
});

// @route   GET /api/detections/statistics/:babyId
// @desc    Get detection statistics for a baby
// @access  Private
router.get('/statistics/:babyId', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Verify baby access
    const baby = await Baby.findById(req.params.babyId);
    if (!baby || !baby.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Baby not found'
      });
    }

    if (!baby.hasAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this baby'
      });
    }

    const statistics = await Detection.getStatistics(req.params.babyId, parseInt(days));

    // Get recent critical detections
    const criticalDetections = await Detection.findCriticalRecent(req.params.babyId, 24);

    // Get total counts
    const totalDetections = await Detection.countDocuments({
      babyId: req.params.babyId
    });

    const falsePositives = await Detection.countDocuments({
      babyId: req.params.babyId,
      isFalsePositive: true
    });

    res.json({
      success: true,
      data: {
        statistics,
        summary: {
          totalDetections,
          falsePositives,
          accuracy: totalDetections > 0 ? 
            ((totalDetections - falsePositives) / totalDetections * 100).toFixed(2) : 0,
          criticalDetectionsLast24h: criticalDetections.length
        },
        criticalDetections: criticalDetections.map(detection => ({
          id: detection._id,
          type: detection.detectionType,
          timestamp: detection.timestamp,
          confidence: detection.confidence,
          status: detection.status
        }))
      }
    });
  } catch (error) {
    console.error('Get detection statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detection statistics'
    });
  }
});

module.exports = router;

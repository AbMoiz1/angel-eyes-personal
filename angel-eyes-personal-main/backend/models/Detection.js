const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonitoringSession',
    required: true
  },
  detectionType: {
    type: String,
    enum: [
      'Choking',
      'UnsafeSleeping', 
      'ExcessiveCrying',
      'MotionDetection',
      'SoundDetection',
      'TemperatureAnomaly',
      'FallDetection',
      'UnusualPosition',
      'FaceRecognition',
      'NoMovement'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  data: {
    // For image/video frame data
    imageUrl: String,
    videoUrl: String,
    thumbnailUrl: String,
    
    // For motion detection
    motionLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    motionArea: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    
    // For sound detection
    soundLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    soundType: {
      type: String,
      enum: ['Crying', 'Coughing', 'Choking', 'Normal', 'Silence', 'Other']
    },
    
    // For position detection
    bodyPosition: {
      type: String,
      enum: ['Back', 'Stomach', 'Side', 'Sitting', 'Unknown']
    },
    headPosition: {
      type: String,
      enum: ['Up', 'Down', 'Left', 'Right', 'Unknown']
    },
    
    // For vital signs (if available)
    heartRate: Number,
    breathingRate: Number,
    bodyTemperature: Number,
    
    // Additional metadata
    rawData: mongoose.Schema.Types.Mixed,
    processingTime: Number, // in milliseconds
    modelVersion: String,
    deviceInfo: {
      camera: String,
      resolution: String,
      fps: Number
    }
  },
  alerts: [{
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['Push', 'Email', 'SMS', 'InApp'],
      required: true
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Read', 'Failed'],
      default: 'Sent'
    },
    response: {
      acknowledgedAt: Date,
      action: {
        type: String,
        enum: ['Acknowledged', 'Dismissed', 'Escalated', 'Resolved']
      }
    }
  }],
  status: {
    type: String,
    enum: ['New', 'Acknowledged', 'Investigating', 'Resolved', 'FalsePositive'],
    default: 'New'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  isFalsePositive: {
    type: Boolean,
    default: false
  },
  falsePositiveReason: String,
  
  // For ML model feedback
  userFeedback: {
    isAccurate: Boolean,
    comments: String,
    providedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    providedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Related detections (for grouping similar events)
  relatedDetections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Detection'
  }],
  
  // For escalation
  escalationLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  escalatedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since detection
detectionSchema.virtual('timeSince').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for severity color
detectionSchema.virtual('severityColor').get(function() {
  const colors = {
    Low: '#4CAF50',     // Green
    Medium: '#FF9800',   // Orange
    High: '#F44336',     // Red
    Critical: '#9C27B0'  // Purple
  };
  return colors[this.severity] || '#757575';
});

// Virtual for unread alerts
detectionSchema.virtual('unreadAlerts').get(function() {
  return this.alerts.filter(alert => 
    alert.status !== 'Read' && !alert.response.acknowledgedAt
  );
});

// Indexes for better performance
detectionSchema.index({ babyId: 1, timestamp: -1 });
detectionSchema.index({ sessionId: 1 });
detectionSchema.index({ detectionType: 1 });
detectionSchema.index({ severity: 1 });
detectionSchema.index({ status: 1 });
detectionSchema.index({ timestamp: -1 });
detectionSchema.index({ confidence: -1 });

// Compound indexes
detectionSchema.index({ babyId: 1, detectionType: 1, timestamp: -1 });
detectionSchema.index({ babyId: 1, status: 1, timestamp: -1 });

// Static method to find by baby and type
detectionSchema.statics.findByBabyAndType = function(babyId, detectionType, limit = 20) {
  return this.find({ babyId, detectionType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('alerts.sentTo', 'firstName lastName email');
};

// Static method to find recent critical detections
detectionSchema.statics.findCriticalRecent = function(babyId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    babyId,
    severity: 'Critical',
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 });
};

// Static method to get detection statistics
detectionSchema.statics.getStatistics = function(babyId, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        babyId: mongoose.Types.ObjectId(babyId),
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          type: '$detectionType',
          severity: '$severity'
        },
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        latestDetection: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Instance method to mark as false positive
detectionSchema.methods.markAsFalsePositive = function(reason, userId) {
  this.isFalsePositive = true;
  this.falsePositiveReason = reason;
  this.status = 'FalsePositive';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  return this.save();
};

// Instance method to escalate detection
detectionSchema.methods.escalate = function(toUserId, reason) {
  this.escalationLevel += 1;
  this.escalatedTo.push({
    user: toUserId,
    reason: reason
  });
  return this.save();
};

// Instance method to resolve detection
detectionSchema.methods.resolve = function(userId, notes) {
  this.status = 'Resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  this.resolutionNotes = notes;
  return this.save();
};

// Instance method to add alert
detectionSchema.methods.addAlert = function(userId, method) {
  this.alerts.push({
    sentTo: userId,
    method: method
  });
  return this.save();
};

// Instance method to acknowledge alert
detectionSchema.methods.acknowledgeAlert = function(alertId, action) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.status = 'Read';
    alert.response = {
      acknowledgedAt: new Date(),
      action: action
    };
    return this.save();
  }
  return Promise.reject(new Error('Alert not found'));
};

module.exports = mongoose.model('Detection', detectionSchema);

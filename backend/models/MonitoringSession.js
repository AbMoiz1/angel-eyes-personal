const mongoose = require('mongoose');

const monitoringSessionSchema = new mongoose.Schema({
  babyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  sessionType: {
    type: String,
    enum: ['Sleep', 'Play', 'Feeding', 'General'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Ended'],
    default: 'Active'
  },
  settings: {
    videoQuality: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'HD'],
      default: 'Medium'
    },
    audioEnabled: {
      type: Boolean,
      default: true
    },
    nightVision: {
      type: Boolean,
      default: false
    },
    motionDetection: {
      type: Boolean,
      default: true
    },
    soundDetection: {
      type: Boolean,
      default: true
    },
    safetyAlerts: {
      type: Boolean,
      default: true
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    }
  },
  detections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Detection'
  }],
  recordings: [{
    filename: String,
    duration: Number, // in seconds
    size: Number, // in bytes
    startTime: Date,
    endTime: Date,
    url: String,
    thumbnailUrl: String
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['Safety', 'Health', 'Movement', 'Sound', 'Technical'],
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  statistics: {
    totalDetections: { type: Number, default: 0 },
    safetyIncidents: { type: Number, default: 0 },
    movementEvents: { type: Number, default: 0 },
    soundEvents: { type: Number, default: 0 },
    averageMotionLevel: { type: Number, default: 0 },
    averageSoundLevel: { type: Number, default: 0 }
  },
  devices: [{
    deviceId: String,
    deviceType: {
      type: String,
      enum: ['Mobile', 'Tablet', 'Web', 'Camera']
    },
    platform: String, // iOS, Android, Web
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    isActive: { type: Boolean, default: true }
  }],
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration in readable format
monitoringSessionSchema.virtual('durationFormatted').get(function() {
  if (this.duration < 60) {
    return `${this.duration} seconds`;
  } else if (this.duration < 3600) {
    return `${Math.floor(this.duration / 60)} minutes`;
  } else {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
});

// Virtual for active alerts
monitoringSessionSchema.virtual('activeAlerts').get(function() {
  return this.alerts.filter(alert => !alert.acknowledged);
});

// Indexes for better performance
monitoringSessionSchema.index({ babyId: 1, startTime: -1 });
monitoringSessionSchema.index({ startedBy: 1 });
monitoringSessionSchema.index({ status: 1 });
monitoringSessionSchema.index({ sessionType: 1 });

// Pre-save middleware to calculate duration
monitoringSessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Static method to find active sessions
monitoringSessionSchema.statics.findActiveSessions = function() {
  return this.find({ status: 'Active' });
};

// Static method to find sessions by baby
monitoringSessionSchema.statics.findByBaby = function(babyId, limit = 10) {
  return this.find({ babyId })
    .sort({ startTime: -1 })
    .limit(limit)
    .populate('startedBy', 'firstName lastName email')
    .populate('detections');
};

// Instance method to add alert
monitoringSessionSchema.methods.addAlert = function(alertData) {
  this.alerts.push({
    type: alertData.type,
    severity: alertData.severity,
    message: alertData.message,
    metadata: alertData.metadata || {}
  });
  
  // Update statistics
  if (alertData.type === 'Safety') {
    this.statistics.safetyIncidents += 1;
  }
  
  return this.save();
};

// Instance method to acknowledge alert
monitoringSessionSchema.methods.acknowledgeAlert = function(alertId, userId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error('Alert not found'));
};

// Instance method to end session
monitoringSessionSchema.methods.endSession = function() {
  this.status = 'Ended';
  this.endTime = new Date();
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  
  // Mark all devices as inactive
  this.devices.forEach(device => {
    if (device.isActive) {
      device.isActive = false;
      device.leftAt = new Date();
    }
  });
  
  return this.save();
};

module.exports = mongoose.model('MonitoringSession', monitoringSessionSchema);

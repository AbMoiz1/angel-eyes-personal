const mongoose = require('mongoose');

const babySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Baby name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [20, 'Height must be at least 20 cm'],
    max: [150, 'Height cannot exceed 150 cm']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0.5, 'Weight must be at least 0.5 kg'],
    max: [30, 'Weight cannot exceed 30 kg']
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: [{
    allergen: { type: String, required: true },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], default: 'Mild' },
    notes: String
  }],
  medicalConditions: [{
    condition: { type: String, required: true },
    diagnosedDate: Date,
    notes: String,
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }]
  }],
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  caregivers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: ['Grandparent', 'Babysitter', 'Nanny', 'Relative', 'Friend', 'Other']
    },
    permissions: {
      viewLiveStream: { type: Boolean, default: false },
      receiveAlerts: { type: Boolean, default: false },
      editRoutines: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false }
    }
  }],
  profilePicture: {
    type: String,
    default: null
  },
  emergencyContacts: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: String,
    isPrimary: { type: Boolean, default: false }
  }],
  doctor: {
    name: String,
    phoneNumber: String,
    email: String,
    clinic: String,
    address: String
  },
  milestones: [{
    type: {
      type: String,
      enum: ['Physical', 'Cognitive', 'Social', 'Language', 'Motor'],
      required: true
    },
    title: { type: String, required: true },
    description: String,
    achievedDate: { type: Date, required: true },
    expectedAgeRange: {
      min: Number, // in months
      max: Number  // in months
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  sleepSettings: {
    bedtime: { type: String, default: '20:00' }, // HH:MM format
    wakeupTime: { type: String, default: '07:00' },
    napTimes: [{
      startTime: String,
      duration: Number // in minutes
    }],
    sleepTrainingMethod: {
      type: String,
      enum: ['Ferber', 'CryItOut', 'NoCryItOut', 'Chair', 'Other', 'None'],
      default: 'None'
    }
  },
  feedingSettings: {
    feedingType: {
      type: String,
      enum: ['Breastfeeding', 'Formula', 'Mixed', 'Solid'],
      required: true
    },
    feedingSchedule: [{
      time: String, // HH:MM format
      amount: Number, // in ml for formula/milk
      type: String // breakfast, lunch, dinner, snack, etc.
    }],
    allergens: [String],
    preferences: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age calculation
babySchema.virtual('ageInMonths').get(function() {
  const now = new Date();
  const birth = new Date(this.dateOfBirth);
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
});

babySchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const birth = new Date(this.dateOfBirth);
  const diffTime = Math.abs(now - birth);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for routines
babySchema.virtual('routines', {
  ref: 'Routine',
  localField: '_id',
  foreignField: 'babyId'
});

// Virtual for monitoring sessions
babySchema.virtual('monitoringSessions', {
  ref: 'MonitoringSession',
  localField: '_id',
  foreignField: 'babyId'
});

// Virtual for detections
babySchema.virtual('detections', {
  ref: 'Detection',
  localField: '_id',
  foreignField: 'babyId'
});

// Indexes for better performance
babySchema.index({ parents: 1 });
babySchema.index({ 'caregivers.user': 1 });
babySchema.index({ isActive: 1 });
babySchema.index({ dateOfBirth: 1 });

// Pre-save middleware
babySchema.pre('save', function(next) {
  // Ensure at least one parent
  if (!this.parents || this.parents.length === 0) {
    return next(new Error('Baby must have at least one parent'));
  }
  
  // Ensure only one primary emergency contact
  const primaryContacts = this.emergencyContacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length > 1) {
    return next(new Error('Only one emergency contact can be primary'));
  }
  
  next();
});

// Static method to find babies by parent
babySchema.statics.findByParent = function(parentId) {
  return this.find({ parents: parentId, isActive: true });
};

// Instance method to check if user has access
babySchema.methods.hasAccess = function(userId) {
  // Check if user is a parent
  if (this.parents.some(parentId => parentId.toString() === userId.toString())) {
    return true;
  }
  
  // Check if user is a caregiver
  return this.caregivers.some(caregiver => 
    caregiver.user && caregiver.user.toString() === userId.toString()
  );
};

// Instance method to get user permissions
babySchema.methods.getUserPermissions = function(userId) {
  // Parents have full permissions
  if (this.parents.some(parentId => parentId.toString() === userId.toString())) {
    return {
      viewLiveStream: true,
      receiveAlerts: true,
      editRoutines: true,
      viewReports: true,
      editProfile: true,
      manageUsers: true
    };
  }
  
  // Check caregiver permissions
  const caregiver = this.caregivers.find(cg => 
    cg.user && cg.user.toString() === userId.toString()
  );
  
  if (caregiver) {
    return caregiver.permissions;
  }
  
  // No access
  return {
    viewLiveStream: false,
    receiveAlerts: false,
    editRoutines: false,
    viewReports: false,
    editProfile: false,
    manageUsers: false
  };
};

module.exports = mongoose.model('Baby', babySchema);

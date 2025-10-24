const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['run', 'walk', 'cross_training', 'rest'],
    required: true
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  pace: {
    type: Number, // in minutes per km
    required: false
  },
  notes: {
    type: String,
    maxlength: 500
  },
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'hot', 'cold'],
    required: false
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    required: false
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'tough', 'difficult'],
    required: false
  },
  isRestDay: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
progressSchema.index({ userId: 1, date: -1 });
progressSchema.index({ userId: 1, type: 1, date: -1 });

// Virtual for calculating pace if not provided
progressSchema.virtual('calculatedPace').get(function() {
  if (this.distance > 0 && this.duration > 0) {
    return this.duration / this.distance;
  }
  return null;
});

// Method to get weekly summary
progressSchema.statics.getWeeklySummary = async function(userId, startDate, endDate) {
  const summary = await this.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDistance: { $sum: '$distance' },
        totalDuration: { $sum: '$duration' },
        totalRuns: { $sum: { $cond: [{ $eq: ['$type', 'run'] }, 1, 0] } },
        totalRestDays: { $sum: { $cond: ['$isRestDay', 1, 0] } },
        averagePace: { $avg: '$pace' },
        averageDifficulty: { $avg: '$difficulty' }
      }
    }
  ]);
  
  return summary[0] || {
    totalDistance: 0,
    totalDuration: 0,
    totalRuns: 0,
    totalRestDays: 0,
    averagePace: 0,
    averageDifficulty: 0
  };
};

// Method to get training streak
progressSchema.statics.getTrainingStreak = async function(userId) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const activities = await this.find({
    userId: userId,
    date: { $gte: thirtyDaysAgo },
    isRestDay: false
  }).sort({ date: -1 });
  
  let streak = 0;
  let currentDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const hasActivity = activities.some(activity => {
      const activityDate = new Date(activity.date);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === currentDate.getTime();
    });
    
    if (hasActivity) {
      streak++;
    } else {
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

module.exports = mongoose.model('Progress', progressSchema);

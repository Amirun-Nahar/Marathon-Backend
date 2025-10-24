const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Add new progress entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, distance, duration, notes, weather, difficulty, mood, isRestDay } = req.body;
    
    // Calculate pace if not provided
    let pace = req.body.pace;
    if (!pace && distance > 0 && duration > 0) {
      pace = duration / distance;
    }
    
    const progress = new Progress({
      userId: req.user.uid,
      type,
      distance: distance || 0,
      duration: duration || 0,
      pace,
      notes,
      weather,
      difficulty,
      mood,
      isRestDay: isRestDay || false
    });
    
    await progress.save();
    
    res.status(201).json({
      message: 'Progress entry added successfully',
      progress: progress
    });
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ message: 'Error adding progress entry' });
  }
});

// Get user's progress entries
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 30, type, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { userId: req.user.uid };
    
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const progress = await Progress.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Progress.countDocuments(query);
    
    res.json({
      progress,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Error fetching progress entries' });
  }
});

// Get weekly summary
router.get('/weekly-summary', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const summary = await Progress.getWeeklySummary(
      req.user.uid,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    res.status(500).json({ message: 'Error fetching weekly summary' });
  }
});

// Get training streak
router.get('/streak', verifyToken, async (req, res) => {
  try {
    const streak = await Progress.getTrainingStreak(req.user.uid);
    res.json({ streak });
  } catch (error) {
    console.error('Error fetching training streak:', error);
    res.status(500).json({ message: 'Error fetching training streak' });
  }
});

// Get progress statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(period) * 24 * 60 * 60 * 1000));
    
    // Get total stats
    const totalStats = await Progress.aggregate([
      {
        $match: {
          userId: req.user.uid,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalActivities: { $sum: 1 },
          averagePace: { $avg: '$pace' },
          averageDifficulty: { $avg: '$difficulty' }
        }
      }
    ]);
    
    // Get activity type breakdown
    const typeBreakdown = await Progress.aggregate([
      {
        $match: {
          userId: req.user.uid,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);
    
    // Get weekly progress
    const weeklyProgress = await Progress.aggregate([
      {
        $match: {
          userId: req.user.uid,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' }
          },
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          activityCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 }
      }
    ]);
    
    res.json({
      totalStats: totalStats[0] || {
        totalDistance: 0,
        totalDuration: 0,
        totalActivities: 0,
        averagePace: 0,
        averageDifficulty: 0
      },
      typeBreakdown,
      weeklyProgress
    });
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({ message: 'Error fetching progress statistics' });
  }
});

// Update progress entry
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Recalculate pace if distance or duration changed
    if (updateData.distance || updateData.duration) {
      const existing = await Progress.findById(id);
      if (existing) {
        const distance = updateData.distance || existing.distance;
        const duration = updateData.duration || existing.duration;
        if (distance > 0 && duration > 0) {
          updateData.pace = duration / distance;
        }
      }
    }
    
    const progress = await Progress.findOneAndUpdate(
      { _id: id, userId: req.user.uid },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress entry not found' });
    }
    
    res.json({
      message: 'Progress entry updated successfully',
      progress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress entry' });
  }
});

// Delete progress entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const progress = await Progress.findOneAndDelete({
      _id: id,
      userId: req.user.uid
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress entry not found' });
    }
    
    res.json({ message: 'Progress entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({ message: 'Error deleting progress entry' });
  }
});

module.exports = router;

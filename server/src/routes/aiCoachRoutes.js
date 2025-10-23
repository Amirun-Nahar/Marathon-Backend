const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Coach endpoint
router.post('/', async (req, res) => {
  try {
    const { userQuery, userTrainingData, userName, currentDate } = req.body;

    if (!userQuery) {
      return res.status(400).json({ error: 'User query is required' });
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create context-aware prompt
    const prompt = `
You are an expert marathon training coach AI assistant. Provide helpful, motivating, and scientifically-backed advice for marathon training.

User: ${userName}
Current Date: ${currentDate}
User Query: ${userQuery}

User's Training Data:
- Total Distance Run: ${userTrainingData?.totalDistance || 0} km
- Total Training Time: ${userTrainingData?.totalTime || 0} minutes
- Average Pace: ${userTrainingData?.averagePace || 0} min/km
- Recent Workouts: ${userTrainingData?.recentWorkouts?.length || 0} workouts
- Current Training Plan: ${userTrainingData?.currentPlan?.name || 'None'}

Instructions:
1. Provide specific, actionable advice based on the user's training data
2. Be encouraging and motivating
3. Include relevant training tips, nutrition advice, or injury prevention tips
4. Keep responses concise but informative (2-3 sentences)
5. Use emojis appropriately to make responses engaging
6. If the user asks about something not related to training, politely redirect to training topics

Respond in a friendly, professional tone as a personal training coach.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Determine response type based on content
    let type = 'info';
    if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('caution')) {
      type = 'warning';
    } else if (text.toLowerCase().includes('great') || text.toLowerCase().includes('excellent') || text.toLowerCase().includes('keep it up')) {
      type = 'motivation';
    } else if (text.toLowerCase().includes('advice') || text.toLowerCase().includes('suggest') || text.toLowerCase().includes('recommend')) {
      type = 'advice';
    }

    res.json({
      response: text,
      type: type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ 
      error: 'Failed to get AI coach response',
      response: "I'm sorry, I'm having trouble connecting to my AI brain right now. Please try again in a moment! 🤖",
      type: 'warning'
    });
  }
});

module.exports = router;

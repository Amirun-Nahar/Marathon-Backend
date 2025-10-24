const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Marathon = require('../models/Marathon');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI-powered recommendations endpoint
router.post('/', async (req, res) => {
  try {
    const { preferences, trainingData, userId } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: 'Preferences are required' });
    }

    console.log('AI Recommendations request received for user:', userId);

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return res.status(500).json({ 
        error: 'AI service configuration error',
        message: 'AI recommendations are not available at the moment'
      });
    }

    // Get all marathons from database
    const allMarathons = await Marathon.find().sort({ createdAt: -1 });
    console.log(`Found ${allMarathons.length} marathons for recommendations`);

    if (allMarathons.length === 0) {
      return res.json({
        recommendations: [],
        message: 'No marathons available for recommendations'
      });
    }

    // Prepare marathon data for AI analysis
    const marathonData = allMarathons.map(marathon => ({
      id: marathon._id,
      title: marathon.title,
      location: marathon.location,
      description: marathon.description,
      distance: marathon.runningDistance,
      difficulty: marathon.difficulty || 'intermediate',
      terrain: marathon.terrain || 'mixed',
      price: marathon.price,
      date: marathon.marathonStartDate,
      registrations: marathon.totalRegistrations,
      amenities: marathon.amenities || []
    }));

    // Create AI prompt for recommendations
    const prompt = `
You are an expert marathon recommendation AI. Analyze the user's preferences and training data to provide personalized marathon recommendations.

User Preferences:
- Preferred Distances: ${preferences.preferredDistance?.join(', ') || 'Not specified'}
- Max Travel Distance: ${preferences.maxTravelDistance || 'Not specified'} km
- Preferred Difficulty: ${preferences.preferredDifficulty?.join(', ') || 'Not specified'}
- Preferred Terrain: ${preferences.preferredTerrain?.join(', ') || 'Not specified'}
- Budget Range: $${preferences.budgetRange?.[0] || 0} - $${preferences.budgetRange?.[1] || 1000}
- Preferred Months: ${preferences.preferredMonths?.join(', ') || 'Not specified'}
- Weather Preference: ${preferences.weatherPreference?.join(', ') || 'Not specified'}

User Training Data:
- Total Distance Run: ${trainingData?.totalDistance || 0} km
- Total Training Time: ${trainingData?.totalTime || 0} minutes
- Average Pace: ${trainingData?.averagePace || 0} min/km
- Recent Workouts: ${trainingData?.recentWorkouts?.length || 0} workouts

Available Marathons:
${marathonData.map(marathon => `
- ${marathon.title} (${marathon.id})
  Location: ${marathon.location}
  Distance: ${marathon.distance}
  Difficulty: ${marathon.difficulty}
  Terrain: ${marathon.terrain}
  Price: $${marathon.price}
  Date: ${marathon.date}
  Description: ${marathon.description}
`).join('\n')}

Instructions:
1. Analyze each marathon against the user's preferences and training data
2. Calculate a compatibility score (0-100) for each marathon
3. Provide 3-6 top recommendations with detailed reasoning
4. Consider factors like: distance preference, difficulty level, budget, location, timing, training level
5. For each recommendation, provide:
   - Marathon ID
   - Compatibility score (0-100)
   - Top 3 reasons why it's a good match
   - Any warnings or considerations

Respond with a JSON object containing:
{
  "recommendations": [
    {
      "marathonId": "marathon_id",
      "score": 85,
      "reasons": ["reason1", "reason2", "reason3"],
      "warnings": ["warning1", "warning2"] // optional
    }
  ],
  "analysis": "Brief summary of the recommendation strategy used"
}

Be specific and practical in your recommendations. Focus on marathons that truly match the user's profile.
`;

    console.log('Calling Gemini API for recommendations...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API response received for recommendations');
    console.log('Raw AI response:', text.substring(0, 500) + '...');
    
    // Parse the AI response
    let aiRecommendations;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found JSON in response, parsing...');
        aiRecommendations = JSON.parse(jsonMatch[0]);
        console.log('Parsed AI recommendations:', JSON.stringify(aiRecommendations, null, 2));
      } else {
        console.log('No JSON found in response, using fallback');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Using fallback recommendations');
      // Fallback to basic recommendations
      aiRecommendations = {
        recommendations: marathonData.slice(0, 3).map(marathon => ({
          marathonId: marathon.id,
          score: 75,
          reasons: ['Good marathon option', 'Matches basic preferences', 'Popular choice'],
          warnings: []
        })),
        analysis: 'Using fallback recommendations due to AI parsing error'
      };
    }

    // Enhance recommendations with full marathon data
    const enhancedRecommendations = aiRecommendations.recommendations.map(rec => {
      const marathon = allMarathons.find(m => m._id.toString() === rec.marathonId);
      if (!marathon) return null;

      return {
        marathon: {
          _id: marathon._id,
          title: marathon.title,
          location: marathon.location,
          description: marathon.description,
          image: marathon.image,
          runningDistance: marathon.runningDistance,
          marathonStartDate: marathon.marathonStartDate,
          totalRegistrations: marathon.totalRegistrations,
          price: marathon.price,
          difficulty: marathon.difficulty || 'intermediate',
          terrain: marathon.terrain || 'mixed',
          weather: marathon.weather || 'unknown',
          amenities: marathon.amenities || []
        },
        score: rec.score,
        reasons: rec.reasons,
        warnings: rec.warnings || [],
        compatibility: {
          distance: rec.score * 0.3,
          location: rec.score * 0.2,
          difficulty: rec.score * 0.25,
          budget: rec.score * 0.15,
          timing: rec.score * 0.1
        }
      };
    }).filter(Boolean);

    console.log('Final enhanced recommendations:', enhancedRecommendations.length);
    console.log('Sending response with', enhancedRecommendations.length, 'recommendations');
    
    return res.json({
      recommendations: enhancedRecommendations,
      analysis: aiRecommendations.analysis,
      totalMarathons: allMarathons.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI recommendations:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return res.status(500).json({ 
        error: 'Invalid API key',
        message: 'AI recommendations are not available due to configuration issues'
      });
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED')) {
      return res.status(500).json({ 
        error: 'API quota exceeded',
        message: 'AI recommendations have reached their daily limit. Please try again tomorrow.'
      });
    }
    
    // Generic error response with fallback
    try {
      const allMarathons = await Marathon.find().sort({ createdAt: -1 });
      const fallbackRecommendations = allMarathons.slice(0, 3).map(marathon => ({
        marathon: {
          _id: marathon._id,
          title: marathon.title,
          location: marathon.location,
          description: marathon.description,
          image: marathon.image,
          runningDistance: marathon.runningDistance,
          marathonStartDate: marathon.marathonStartDate,
          totalRegistrations: marathon.totalRegistrations,
          price: marathon.price,
          difficulty: marathon.difficulty || 'intermediate',
          terrain: marathon.terrain || 'mixed',
          weather: marathon.weather || 'unknown',
          amenities: marathon.amenities || []
        },
        score: 70,
        reasons: ['Popular marathon choice', 'Good for most runners', 'Well-organized event'],
        warnings: [],
        compatibility: {
          distance: 70,
          location: 70,
          difficulty: 70,
          budget: 70,
          timing: 70
        }
      }));

      return res.json({
        recommendations: fallbackRecommendations,
        analysis: 'Using fallback recommendations due to AI service error',
        totalMarathons: allMarathons.length,
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError) {
      console.error('Fallback recommendations also failed:', fallbackError);
      return res.status(500).json({ 
        error: 'Failed to get recommendations',
        message: 'Unable to provide recommendations at this time'
      });
    }
  }
});

module.exports = router;

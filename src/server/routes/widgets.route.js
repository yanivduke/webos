const express = require('express');
const router = express.Router();

// GET /api/widgets/weather - Get weather data
router.get('/weather', async (req, res) => {
  const { location = 'New York', units = 'metric' } = req.query;

  try {
    // Mock weather data (in production, this would call OpenWeatherMap or similar API)
    const mockWeatherData = {
      temp: units === 'metric' ? 22 : 72,
      description: 'partly cloudy',
      humidity: 65,
      windSpeed: units === 'metric' ? 5.2 : 11.6,
      location: location
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    res.json(mockWeatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// GET /api/widgets/news - Get news headlines
router.get('/news', async (req, res) => {
  const { category = 'technology', maxItems = 5 } = req.query;

  try {
    // Mock news data (in production, this would call NewsAPI or similar)
    const mockNews = {
      technology: [
        { title: 'New AI breakthrough announced by researchers', url: '#', source: 'Tech News' },
        { title: 'Quantum computing reaches new milestone', url: '#', source: 'Science Daily' },
        { title: 'Latest smartphone features gesture controls', url: '#', source: 'Mobile World' },
        { title: 'Cloud computing trends for 2024', url: '#', source: 'Tech Trends' },
        { title: 'Cybersecurity threats on the rise', url: '#', source: 'Security Weekly' }
      ],
      business: [
        { title: 'Stock markets reach new heights', url: '#', source: 'Business Times' },
        { title: 'Startup funding hits record levels', url: '#', source: 'Venture Beat' },
        { title: 'Global trade agreements announced', url: '#', source: 'Economic Review' },
        { title: 'Tech companies report strong earnings', url: '#', source: 'Financial News' },
        { title: 'Retail sector shows growth', url: '#', source: 'Commerce Daily' }
      ],
      science: [
        { title: 'New planet discovered in nearby system', url: '#', source: 'Space News' },
        { title: 'Medical breakthrough in cancer research', url: '#', source: 'Health Science' },
        { title: 'Climate study reveals new insights', url: '#', source: 'Environmental Journal' },
        { title: 'Fusion energy experiment succeeds', url: '#', source: 'Physics Today' },
        { title: 'Archaeological discovery rewrites history', url: '#', source: 'Archaeology Now' }
      ],
      general: [
        { title: 'Breaking: Major event unfolds', url: '#', source: 'World News' },
        { title: 'Local community celebrates milestone', url: '#', source: 'Community Times' },
        { title: 'Weather patterns shift globally', url: '#', source: 'Climate Watch' },
        { title: 'Sports team wins championship', url: '#', source: 'Sports Network' },
        { title: 'Cultural festival draws thousands', url: '#', source: 'Arts & Culture' }
      ],
      entertainment: [
        { title: 'New blockbuster movie breaks records', url: '#', source: 'Entertainment Weekly' },
        { title: 'Music artist releases surprise album', url: '#', source: 'Music News' },
        { title: 'Award ceremony announces winners', url: '#', source: 'Celebrity Watch' },
        { title: 'Streaming service launches new series', url: '#', source: 'Stream Guide' },
        { title: 'Gaming convention showcases titles', url: '#', source: 'Game Insider' }
      ]
    };

    const categoryNews = mockNews[category] || mockNews.general;
    const items = categoryNews.slice(0, parseInt(maxItems));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
      category: category,
      items: items
    });
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({
      error: 'Failed to fetch news data',
      message: error.message
    });
  }
});

module.exports = router;

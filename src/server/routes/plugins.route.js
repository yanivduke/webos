/**
 * Plugin Management Routes
 * Handles plugin installation, listing, and metadata
 */

const express = require('express');
const router = express.Router();

// Sample plugin catalog (in production, this would come from a database or plugin registry)
const availablePlugins = [
  {
    id: 'hello-world',
    name: 'Hello World',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'A simple demonstration plugin that shows notifications and adds desktop icons',
    permissions: ['notifications', 'ui'],
    category: 'utility',
    icon: '👋',
    downloadUrl: '/plugins/hello-world-plugin.ts',
    size: 2048,
    rating: 4.5,
    downloads: 1250,
    verified: true
  },
  {
    id: 'custom-theme',
    name: 'Custom Theme',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'Customize desktop background color and appearance with various themes',
    permissions: ['ui', 'storage', 'notifications'],
    category: 'theme',
    icon: '🎨',
    downloadUrl: '/plugins/custom-theme-plugin.ts',
    size: 3072,
    rating: 4.8,
    downloads: 2100,
    verified: true
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'Add sticky notes widget to your desktop for quick reminders and to-do lists',
    permissions: ['ui', 'storage', 'notifications'],
    category: 'productivity',
    icon: '📝',
    downloadUrl: '/plugins/quick-notes-plugin.ts',
    size: 4096,
    rating: 4.7,
    downloads: 1800,
    verified: true
  },
  {
    id: 'file-preview',
    name: 'File Preview',
    version: '1.2.0',
    author: 'Community',
    description: 'Enhanced file preview with support for images, PDFs, and text files',
    permissions: ['filesystem', 'ui'],
    category: 'utility',
    icon: '👁',
    downloadUrl: null, // Not available yet
    size: 8192,
    rating: 4.3,
    downloads: 950,
    verified: false
  },
  {
    id: 'music-player',
    name: 'Music Player',
    version: '2.0.0',
    author: 'Community',
    description: 'Play music files with a retro-style audio player interface',
    permissions: ['filesystem', 'ui', 'notifications'],
    category: 'entertainment',
    icon: '🎵',
    downloadUrl: null,
    size: 12288,
    rating: 4.6,
    downloads: 3200,
    verified: false
  },
  {
    id: 'network-monitor',
    name: 'Network Monitor',
    version: '1.0.0',
    author: 'Community',
    description: 'Monitor network activity and API requests in real-time',
    permissions: ['network', 'system', 'ui'],
    category: 'developer',
    icon: '📡',
    downloadUrl: null,
    size: 6144,
    rating: 4.4,
    downloads: 720,
    verified: false
  },
  {
    id: 'terminal-plus',
    name: 'Terminal Plus',
    version: '1.5.0',
    author: 'Community',
    description: 'Enhanced terminal with syntax highlighting and command history',
    permissions: ['system', 'filesystem', 'ui'],
    category: 'developer',
    icon: '⌨',
    downloadUrl: null,
    size: 10240,
    rating: 4.9,
    downloads: 4500,
    verified: true
  },
  {
    id: 'retro-games',
    name: 'Retro Games',
    version: '1.0.0',
    author: 'Community',
    description: 'Collection of classic games: Snake, Tetris, and Pong',
    permissions: ['ui', 'storage'],
    category: 'entertainment',
    icon: '🎮',
    downloadUrl: null,
    size: 15360,
    rating: 4.2,
    downloads: 5600,
    verified: false
  }
];

// Plugin installation history (in-memory)
const installationHistory = [];

/**
 * GET /api/plugins/available
 * List all available plugins from the catalog
 */
router.get('/available', (req, res) => {
  try {
    const { category, verified, search } = req.query;

    let filtered = [...availablePlugins];

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    // Filter by verified status
    if (verified === 'true') {
      filtered = filtered.filter(p => p.verified);
    }

    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by downloads (most popular first)
    filtered.sort((a, b) => b.downloads - a.downloads);

    res.json({
      success: true,
      plugins: filtered,
      total: filtered.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching available plugins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available plugins'
    });
  }
});

/**
 * GET /api/plugins/:id/info
 * Get detailed information about a specific plugin
 */
router.get('/:id/info', (req, res) => {
  try {
    const { id } = req.params;
    const plugin = availablePlugins.find(p => p.id === id);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    // Add additional detailed information
    const detailedInfo = {
      ...plugin,
      changelog: [
        { version: plugin.version, date: '2024-01-15', changes: ['Initial release'] }
      ],
      screenshots: [],
      requirements: {
        minWebOSVersion: '2.0.0',
        maxPlugins: 50
      },
      support: {
        documentation: `/docs/plugins/${id}`,
        issues: `/issues/plugins/${id}`,
        contact: `${plugin.author}@webos.dev`
      }
    };

    res.json({
      success: true,
      plugin: detailedInfo,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching plugin info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plugin information'
    });
  }
});

/**
 * POST /api/plugins/install
 * Install a plugin from URL or file
 */
router.post('/install', async (req, res) => {
  try {
    const { pluginId, source } = req.body;

    if (!pluginId) {
      return res.status(400).json({
        success: false,
        error: 'Plugin ID is required'
      });
    }

    const plugin = availablePlugins.find(p => p.id === pluginId);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found in catalog'
      });
    }

    if (!plugin.downloadUrl) {
      return res.status(400).json({
        success: false,
        error: 'Plugin is not available for download yet'
      });
    }

    // In a real implementation, this would:
    // 1. Download the plugin from the source URL
    // 2. Verify the plugin signature
    // 3. Scan for security issues
    // 4. Store the plugin code securely

    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Record installation
    const installation = {
      pluginId,
      pluginName: plugin.name,
      version: plugin.version,
      installedAt: Date.now(),
      source: source || plugin.downloadUrl,
      success: true
    };

    installationHistory.push(installation);

    // Update download count
    plugin.downloads += 1;

    res.json({
      success: true,
      installation,
      message: `Plugin ${plugin.name} installed successfully`
    });
  } catch (error) {
    console.error('Error installing plugin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to install plugin'
    });
  }
});

/**
 * GET /api/plugins/categories
 * Get list of plugin categories with counts
 */
router.get('/categories', (req, res) => {
  try {
    const categoryCounts = {};

    availablePlugins.forEach(plugin => {
      categoryCounts[plugin.category] = (categoryCounts[plugin.category] || 0) + 1;
    });

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      icon: getCategoryIcon(name)
    }));

    res.json({
      success: true,
      categories,
      total: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * GET /api/plugins/featured
 * Get featured/recommended plugins
 */
router.get('/featured', (req, res) => {
  try {
    // Get top-rated verified plugins
    const featured = availablePlugins
      .filter(p => p.verified)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    res.json({
      success: true,
      plugins: featured,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching featured plugins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured plugins'
    });
  }
});

/**
 * GET /api/plugins/history
 * Get plugin installation history
 */
router.get('/history', (req, res) => {
  try {
    res.json({
      success: true,
      history: installationHistory.slice(-20).reverse(), // Last 20 installations
      total: installationHistory.length
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch installation history'
    });
  }
});

/**
 * Helper function to get category icon
 */
function getCategoryIcon(category) {
  const icons = {
    utility: '🔧',
    theme: '🎨',
    productivity: '📊',
    system: '⚙',
    entertainment: '🎮',
    developer: '💻'
  };
  return icons[category] || '🧩';
}

module.exports = router;

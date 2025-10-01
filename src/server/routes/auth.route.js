const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory session storage (in production, use Redis or database)
const sessions = new Map();
const users = new Map();

// Default admin user
users.set('admin', {
  id: 'admin',
  username: 'admin',
  password: hashPassword('admin'), // Change in production!
  displayName: 'Administrator',
  role: 'admin',
  created: new Date().toISOString()
});

// Default guest user
users.set('guest', {
  id: 'guest',
  username: 'guest',
  password: hashPassword('guest'),
  displayName: 'Guest User',
  role: 'user',
  created: new Date().toISOString()
});

/**
 * Simple password hashing (use bcrypt in production)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate session token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/login - User login
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const user = users.get(username);

    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Create session
    const token = generateToken();
    const session = {
      token,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    sessions.set(token, session);

    res.json({
      message: 'Login successful',
      session: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout - User logout
 */
router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({
        error: 'No token provided'
      });
    }

    sessions.delete(token);

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/session - Get current session info
 */
router.get('/session', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const session = sessions.get(token);

    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired session'
      });
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();

    res.json({
      session: {
        token: session.token,
        user: {
          id: session.userId,
          username: session.username,
          displayName: session.displayName,
          role: session.role
        },
        created: session.created,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      error: 'Session check failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/register - Register new user
 */
router.post('/register', (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    if (users.has(username)) {
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    const user = {
      id: crypto.randomUUID(),
      username,
      password: hashPassword(password),
      displayName: displayName || username,
      role: 'user',
      created: new Date().toISOString()
    };

    users.set(username, user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/users - List all users (admin only)
 */
router.get('/users', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const session = sessions.get(token);

    if (!session || session.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      created: user.created
    }));

    res.json({
      users: userList
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      error: 'Failed to list users',
      message: error.message
    });
  }
});

/**
 * Middleware to verify session
 */
function verifySession(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({
      error: 'Invalid or expired session'
    });
  }

  // Update last activity
  session.lastActivity = new Date().toISOString();

  // Attach session to request
  req.session = session;
  next();
}

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

  for (const [token, session] of sessions.entries()) {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > expirationTime) {
      sessions.delete(token);
      console.log(`Session expired for user: ${session.username}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;
module.exports.verifySession = verifySession;

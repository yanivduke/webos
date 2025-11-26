/**
 * Authentication Route Tests
 *
 * Tests for user authentication including:
 * - Login/logout flows
 * - Session management
 * - Registration
 * - Authorization
 * - Security edge cases
 */

const request = require('supertest');
const app = require('../index');

describe('Authentication API', () => {
  let adminToken = null;
  let userToken = null;

  // Helper function to login
  const login = async (username, password) => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password });
    return res;
  };

  describe('POST /api/auth/login', () => {

    describe('Successful Login', () => {
      it('should login admin user with correct credentials', async () => {
        const res = await login('admin', 'admin');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Login successful');
        expect(res.body).toHaveProperty('session');
        expect(res.body.session).toHaveProperty('token');
        expect(res.body.session).toHaveProperty('user');
        expect(res.body.session.user.username).toBe('admin');
        expect(res.body.session.user.role).toBe('admin');

        adminToken = res.body.session.token;
      });

      it('should login guest user with correct credentials', async () => {
        const res = await login('guest', 'guest');

        expect(res.status).toBe(200);
        expect(res.body.session.user.username).toBe('guest');
        expect(res.body.session.user.role).toBe('user');

        userToken = res.body.session.token;
      });

      it('should return user details without password', async () => {
        const res = await login('admin', 'admin');

        expect(res.body.session.user).not.toHaveProperty('password');
      });

      it('should return unique tokens for each login', async () => {
        const res1 = await login('admin', 'admin');
        const res2 = await login('admin', 'admin');

        expect(res1.body.session.token).not.toBe(res2.body.session.token);
      });
    });

    describe('Failed Login', () => {
      it('should reject invalid password', async () => {
        const res = await login('admin', 'wrongpassword');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid username or password');
      });

      it('should reject non-existent username', async () => {
        const res = await login('nonexistent', 'password');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid username or password');
      });

      it('should require username', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('required');
      });

      it('should require password', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ username: 'admin' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('required');
      });

      it('should require both username and password', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe('Security - Login', () => {
      it('should not reveal whether username exists', async () => {
        const resNonExistent = await login('nonexistent', 'password');
        const resWrongPassword = await login('admin', 'wrongpassword');

        // Both should return same error message
        expect(resNonExistent.body.error).toBe(resWrongPassword.body.error);
      });

      it('should handle SQL injection attempts', async () => {
        const res = await login("admin' OR '1'='1", 'password');

        expect(res.status).toBe(401);
      });

      it('should handle script injection in username', async () => {
        const res = await login('<script>alert("xss")</script>', 'password');

        expect(res.status).toBe(401);
      });

      it('should handle very long usernames', async () => {
        const longUsername = 'a'.repeat(10000);
        const res = await login(longUsername, 'password');

        expect(res.status).toBe(401);
      });

      it('should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(10000);
        const res = await login('admin', longPassword);

        expect(res.status).toBe(401);
      });

      it('should handle unicode in credentials', async () => {
        const res = await login('管理员', '密码');

        expect(res.status).toBe(401);
      });

      it('should handle null bytes in credentials', async () => {
        const res = await login('admin\x00', 'admin');

        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      const res = await login('admin', 'admin');
      token = res.body.session.token;
    });

    it('should logout successfully with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logout successful');
    });

    it('should invalidate session after logout', async () => {
      // First logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Try to use session
      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it('should reject logout without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No token');
    });

    it('should handle logout with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      // Should still return success (idempotent)
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/session', () => {
    let token;

    beforeEach(async () => {
      const res = await login('admin', 'admin');
      token = res.body.session.token;
    });

    it('should return session info with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('session');
      expect(res.body.session).toHaveProperty('token');
      expect(res.body.session).toHaveProperty('user');
      expect(res.body.session).toHaveProperty('created');
      expect(res.body.session).toHaveProperty('lastActivity');
    });

    it('should update lastActivity on session check', async () => {
      // First request
      const res1 = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`);

      const activity1 = res1.body.session.lastActivity;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request
      const res2 = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`);

      const activity2 = res2.body.session.lastActivity;

      // Last activity should be updated
      expect(new Date(activity2).getTime()).toBeGreaterThanOrEqual(
        new Date(activity1).getTime()
      );
    });

    it('should reject without Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/session');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('No token');
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('should reject with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', 'NotBearer token');

      expect(res.status).toBe(401);
    });

    it('should not expose password in response', async () => {
      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.session.user).not.toHaveProperty('password');
    });
  });

  describe('POST /api/auth/register', () => {
    const uniqueUsername = () => `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    it('should register new user', async () => {
      const username = uniqueUsername();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          password: 'testpassword',
          displayName: 'Test User'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user.username).toBe(username);
      expect(res.body.user.displayName).toBe('Test User');
      expect(res.body.user.role).toBe('user');
    });

    it('should register user and allow login', async () => {
      const username = uniqueUsername();
      const password = 'testpassword123';

      // Register
      await request(app)
        .post('/api/auth/register')
        .send({ username, password });

      // Login
      const loginRes = await login(username, password);

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.session.user.username).toBe(username);
    });

    it('should use username as displayName if not provided', async () => {
      const username = uniqueUsername();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          password: 'testpassword'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.displayName).toBe(username);
    });

    it('should reject duplicate username', async () => {
      const username = uniqueUsername();

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({ username, password: 'password1' });

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username, password: 'password2' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject registration for existing users', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          password: 'newpassword'
        });

      expect(res.status).toBe(409);
    });

    it('should require username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should require password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: uniqueUsername() });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should not return password in response', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername(),
          password: 'testpassword'
        });

      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should assign user role by default', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername(),
          password: 'testpassword'
        });

      expect(res.body.user.role).toBe('user');
    });
  });

  describe('GET /api/auth/users', () => {

    it('should return user list for admin', async () => {
      const loginRes = await login('admin', 'admin');
      const token = loginRes.body.session.token;

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('should include admin and guest users in list', async () => {
      const loginRes = await login('admin', 'admin');
      const token = loginRes.body.session.token;

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      const usernames = res.body.users.map(u => u.username);
      expect(usernames).toContain('admin');
      expect(usernames).toContain('guest');
    });

    it('should not include passwords in user list', async () => {
      const loginRes = await login('admin', 'admin');
      const token = loginRes.body.session.token;

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should reject non-admin users', async () => {
      const loginRes = await login('guest', 'guest');
      const token = loginRes.body.session.token;

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Admin access');
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .get('/api/auth/users');

      expect(res.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(403);
    });
  });

  describe('Session Security', () => {

    it('should generate cryptographically strong tokens', async () => {
      const res = await login('admin', 'admin');
      const token = res.body.session.token;

      // Token should be 64 characters (32 bytes hex encoded)
      expect(token.length).toBe(64);
      // Token should be hexadecimal
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should handle concurrent logins', async () => {
      const logins = await Promise.all([
        login('admin', 'admin'),
        login('admin', 'admin'),
        login('admin', 'admin'),
      ]);

      // All should succeed
      logins.forEach(res => {
        expect(res.status).toBe(200);
      });

      // All tokens should be different
      const tokens = logins.map(res => res.body.session.token);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);
    });

    it('should handle rapid session checks', async () => {
      const loginRes = await login('admin', 'admin');
      const token = loginRes.body.session.token;

      const checks = await Promise.all(
        Array.from({ length: 10 }, () =>
          request(app)
            .get('/api/auth/session')
            .set('Authorization', `Bearer ${token}`)
        )
      );

      // All should succeed
      checks.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Edge Cases', () => {

    it('should handle empty string credentials', async () => {
      const res = await login('', '');

      expect(res.status).toBe(400);
    });

    it('should handle whitespace-only credentials', async () => {
      const res = await login('   ', '   ');

      expect(res.status).toBe(401);
    });

    it('should handle special characters in password', async () => {
      // First register user with special chars
      const username = `special_${Date.now()}`;
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';

      await request(app)
        .post('/api/auth/register')
        .send({ username, password: specialPassword });

      // Should be able to login
      const res = await login(username, specialPassword);
      expect(res.status).toBe(200);
    });

    it('should handle case-sensitive usernames', async () => {
      const res = await login('Admin', 'admin');

      // Usernames should be case-sensitive
      expect(res.status).toBe(401);
    });

    it('should handle JSON content type', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ username: 'admin', password: 'admin' }));

      expect(res.status).toBe(200);
    });
  });
});

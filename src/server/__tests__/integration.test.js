const request = require('supertest');
const express = require('express');

// Mock app setup
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Import routes
  const authRoutes = require('../routes/auth.route');
  const fileRoutes = require('../routes/file-operations.route');
  const systemRoutes = require('../routes/system-status.route');

  app.use('/api/auth', authRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/system', systemRoutes);

  return app;
}

describe('Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Authentication Flow', () => {
    let authToken;

    it('should login successfully with admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin',
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.session).toBeDefined();
      expect(response.body.session.token).toBeDefined();
      authToken = response.body.session.token;
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should verify session with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.session).toBeDefined();
      expect(response.body.session.user.username).toBe('admin');
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/auth/session')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should logout successfully', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('File Operations', () => {
    it('should list files in a directory', async () => {
      const response = await request(app)
        .get('/api/files')
        .query({ path: 'df0' })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should create a new folder', async () => {
      const response = await request(app)
        .post('/api/files/folder')
        .send({
          path: 'df0',
          name: 'TestFolder',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle path traversal attempts', async () => {
      await request(app)
        .get('/api/files')
        .query({ path: '../../../etc/passwd' })
        .expect(400);
    });
  });

  describe('System Status', () => {
    it('should return system information', async () => {
      const response = await request(app)
        .get('/api/system/status')
        .expect(200);

      expect(response.body.cpu).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.disks).toBeDefined();
    });
  });

  describe('SDK Operations', () => {
    it('should list available SDK operations', async () => {
      const response = await request(app)
        .get('/api/sdk')
        .expect(200);

      expect(response.body.version).toBeDefined();
    });
  });
});

describe('Security Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Input Validation', () => {
    it('should reject malformed JSON', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should reject SQL injection attempts', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: "admin' OR '1'='1",
          password: "anything",
        })
        .expect(401);
    });

    it('should reject XSS attempts in file names', async () => {
      await request(app)
        .post('/api/files/folder')
        .send({
          path: 'df0',
          name: '<script>alert("xss")</script>',
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid requests', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/system/status')
            .expect(200)
        );
      }

      await Promise.all(requests);
      // All should succeed (no rate limiting in test environment)
    });
  });
});

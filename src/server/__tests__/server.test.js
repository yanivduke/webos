const request = require('supertest');
const app = require('../index');

describe('WebOS Server - Basic Tests', () => {
  describe('GET /', () => {
    it('should return server information', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'WebOS Server');
      expect(res.body).toHaveProperty('version', '2.0.0');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toHaveProperty('health', '/api/health');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('message', 'WebOS Server is running');
      expect(res.body).toHaveProperty('version', '2.0.0');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
      expect(res.body).toHaveProperty('availableEndpoints');
    });
  });
});

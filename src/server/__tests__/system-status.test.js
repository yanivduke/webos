const request = require('supertest');
const app = require('../index');

describe('System Status API', () => {
  describe('GET /api/system/status', () => {
    it('should return system status', async () => {
      const res = await request(app).get('/api/system/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('cpu');
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('disks');
      expect(res.body).toHaveProperty('uptime');
    });

    it('should return valid CPU information', async () => {
      const res = await request(app).get('/api/system/status');
      expect(res.body.cpu).toHaveProperty('model');
      expect(res.body.cpu).toHaveProperty('speed');
      expect(res.body.cpu).toHaveProperty('usage');
    });

    it('should return valid memory information', async () => {
      const res = await request(app).get('/api/system/status');
      expect(res.body.memory).toHaveProperty('chip');
      expect(res.body.memory).toHaveProperty('fast');
      expect(res.body.memory).toHaveProperty('total');
      expect(res.body.memory).toHaveProperty('free');
    });

    it('should return valid disk information', async () => {
      const res = await request(app).get('/api/system/status');
      expect(Array.isArray(res.body.disks)).toBe(true);
      expect(res.body.disks.length).toBeGreaterThan(0);
      expect(res.body.disks[0]).toHaveProperty('name');
      expect(res.body.disks[0]).toHaveProperty('capacity');
      expect(res.body.disks[0]).toHaveProperty('used');
      expect(res.body.disks[0]).toHaveProperty('available');
    });
  });
});

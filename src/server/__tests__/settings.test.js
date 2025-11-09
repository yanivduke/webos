const request = require('supertest');
const app = require('../index');

describe('Settings API', () => {
  describe('GET /api/settings', () => {
    it('should return all settings', async () => {
      const res = await request(app).get('/api/settings');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('display');
      expect(res.body).toHaveProperty('sound');
      expect(res.body).toHaveProperty('workbench');
      expect(res.body).toHaveProperty('system');
    });
  });

  describe('POST /api/settings', () => {
    it('should update settings', async () => {
      const newSettings = {
        display: {
          resolution: '1024x768',
          colorDepth: 16,
          screenMode: 'PAL'
        }
      };

      const res = await request(app)
        .post('/api/settings')
        .send(newSettings);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should persist updated settings', async () => {
      const newSettings = {
        sound: {
          volume: 75,
          enabled: false
        }
      };

      await request(app)
        .post('/api/settings')
        .send(newSettings);

      const res = await request(app).get('/api/settings');
      expect(res.body.sound.volume).toBe(75);
      expect(res.body.sound.enabled).toBe(false);
    });
  });
});

const request = require('supertest');
const app = require('../index');

describe('File Operations API', () => {
  describe('GET /api/files/list', () => {
    it('should return files for df0 disk', async () => {
      const res = await request(app).get('/api/files/list?path=df0');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should return files for dh0 disk', async () => {
      const res = await request(app).get('/api/files/list?path=dh0');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should return files for ram disk', async () => {
      const res = await request(app).get('/api/files/list?path=ram');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should reject path traversal attempts', async () => {
      const res = await request(app).get('/api/files/list?path=../../../etc');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/files/create', () => {
    it('should create a new file', async () => {
      const res = await request(app)
        .post('/api/files/create')
        .send({
          path: 'ram',
          name: 'test-file.txt',
          type: 'file',
          content: 'Test content'
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should create a new folder', async () => {
      const res = await request(app)
        .post('/api/files/create')
        .send({
          path: 'ram',
          name: 'test-folder',
          type: 'directory'
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject path traversal attempts', async () => {
      const res = await request(app)
        .post('/api/files/create')
        .send({
          path: '../../../etc',
          name: 'test.txt',
          type: 'file'
        });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/files/delete', () => {
    beforeEach(async () => {
      // Create a test file to delete
      await request(app)
        .post('/api/files/create')
        .send({
          path: 'ram',
          name: 'delete-test.txt',
          type: 'file',
          content: 'Delete me'
        });
    });

    it('should delete a file', async () => {
      const res = await request(app)
        .delete('/api/files/delete')
        .send({
          path: 'ram/delete-test.txt'
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});

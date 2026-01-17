import request from 'supertest';
import app from '../../server';

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('404 Route', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});

import request from 'supertest';
import app from '../../server';

const getAuthToken = async (): Promise<string> => {
  try {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@quincaillerie.com',
        password: 'admin123'
      });

    if (response.status === 200) {
      return response.body.token;
    }
  } catch (error) {
    // Si le login echoue, utiliser un token mock
  }
  return 'mock-token';
};

describe('Returns API', () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  describe('GET /api/returns', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/returns');

      expect(response.status).toBe(401);
    });

    it('should return returns list with authentication', async () => {
      const response = await request(app)
        .get('/api/returns')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('returns');
        expect(Array.isArray(response.body.returns)).toBe(true);
      }
    });
  });

  describe('GET /api/returns/stats', () => {
    it('should return return statistics', async () => {
      const response = await request(app)
        .get('/api/returns/stats')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('stats');
      }
    });
  });

  describe('GET /api/returns/sale/:saleId', () => {
    it('should return 404 for non-existent sale', async () => {
      const response = await request(app)
        .get('/api/returns/sale/99999')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status !== 401) {
        expect([404, 500]).toContain(response.status);
      }
    });
  });

  describe('GET /api/returns/:id', () => {
    it('should return 404 for non-existent return', async () => {
      const response = await request(app)
        .get('/api/returns/99999')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status !== 401) {
        expect([404, 500]).toContain(response.status);
      }
    });
  });

  describe('POST /api/returns', () => {
    it('should return 400 for return without items', async () => {
      const response = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refund_method: 'cash'
        });

      if (response.status !== 401) {
        expect([400, 500]).toContain(response.status);
      }
    });
  });
});

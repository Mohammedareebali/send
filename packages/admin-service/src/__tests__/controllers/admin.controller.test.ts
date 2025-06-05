import request from 'supertest';
import app from '../../app';

describe('Admin routes', () => {
  it('returns metrics', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalRunsToday');
  });
});

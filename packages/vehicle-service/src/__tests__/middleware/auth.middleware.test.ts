import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware';

const app = express();
app.get('/test', authMiddleware, (_: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

describe('authMiddleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('allows requests with valid token', async () => {
    const token = jwt.sign({ id: 'user1' }, process.env.JWT_SECRET as string);
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('rejects requests with invalid token', async () => {
    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer invalid');

    expect(res.status).toBe(401);
  });
});

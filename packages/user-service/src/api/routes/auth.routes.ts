import { Router } from 'express';
import { AuthService } from '../../core/services/AuthService';
import { UserRepository } from '../../data/repositories/UserRepository';
import { AppError } from '@shared/errors';
import { createSuccessResponse } from '@send/shared';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { getRepository } from 'typeorm';
import { User } from '../../data/entities/User';
import { AppDataSource } from '../../data/data-source';

const router = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

router.post(
  '/login',
  validateRequest(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(createSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/register',
  validateRequest(registerSchema),
  async (req, res, next) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(createSuccessResponse(user));
    } catch (error) {
      next(error);
    }
  }
);

router.post('/refresh-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError(400, 'Token is required');
    }

    const user = await authService.validateToken(token);
    const newToken = authService.generateToken(user);
    res.json(createSuccessResponse({ user, token: newToken }));
  } catch (error) {
    next(error);
  }
});

export const authRoutes = router; 
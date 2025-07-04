import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireRole } from '@send/shared/security/auth';
import { UserRole } from '@shared/types';

const router = Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/password/reset-request', UserController.requestPasswordReset);
router.post('/password/reset', UserController.resetPassword);

// Protected routes
router.get('/profile', authenticate(), UserController.getProfile);
router.put('/profile', authenticate(), UserController.updateProfile);
router.put('/password', authenticate(), UserController.changePassword);

// Admin routes
router.get('/users', authenticate(), requireRole([UserRole.ADMIN]), UserController.getAllUsers);
router.get('/users/:id', authenticate(), requireRole([UserRole.ADMIN]), UserController.getUserById);
router.put('/users/:id', authenticate(), requireRole([UserRole.ADMIN]), UserController.updateUser);
router.delete('/users/:id', authenticate(), requireRole([UserRole.ADMIN]), UserController.deleteUser);

export default router; 
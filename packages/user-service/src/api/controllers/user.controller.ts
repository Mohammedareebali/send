import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../../data/models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole, DriverData, PAData, GuardianData } from '@shared/types';
import { mapPrismaRoleToShared, mapSharedRoleToPrisma } from '../../data/mappers/user.mapper';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PasswordResetTokenModel } from '../../data/models/passwordResetToken.model';
import { NotificationService } from '../../../../system-notification-service/src/services/notification.service';
import { NotificationChannel, NotificationPriority } from '../../../../system-notification-service/src/types/notification.types';
import { publishEvent } from '../../infra/eventBus';
import { AppError } from '@shared/errors';
import { createSuccessResponse } from '@send/shared';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export const UserController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, ...roleData } = req.body;
      
      // Create base user
      const user = await UserModel.create({
        email,
        password,
        firstName,
        lastName,
        role: mapSharedRoleToPrisma(role),
        driverData: role === UserRole.DRIVER ? {
          licenseNumber: roleData.licenseNumber,
          licenseExpiry: new Date(roleData.licenseExpiry),
        } : undefined,
        paData: role === UserRole.PA ? {
          certification: roleData.certification,
        } : undefined,
        guardianData: role === UserRole.GUARDIAN ? {
          address: roleData.address,
        } : undefined,
      });

      await publishEvent('user.created', user);

      res.status(201).json(createSuccessResponse(user));
    } catch (error: any) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      await UserModel.update(user.id, {
        lastLoginAt: new Date(),
        loginCount: (user.loginCount || 0) + 1,
      });

      await publishEvent('user.login', { id: user.id, email: user.email });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: mapPrismaRoleToShared(user.role) },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      res.json(createSuccessResponse({ token }));
    } catch (error: any) {
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      res.json(createSuccessResponse(user));
    } catch (error: any) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!;
      const { firstName, lastName, ...roleData } = req.body;
      
      // Get current user to check role
      const currentUser = await UserModel.findById(id);
      if (!currentUser) {
        throw new AppError('User not found', 404);
      }

      // Update user data
      const user = await UserModel.update(id, {
        firstName,
        lastName,
        driverData: currentUser.role === 'DRIVER' ? {
          licenseNumber: roleData.licenseNumber,
          licenseExpiry: roleData.licenseExpiry ? new Date(roleData.licenseExpiry) : undefined,
        } : undefined,
        paData: currentUser.role === 'PA' ? {
          certification: roleData.certification,
        } : undefined,
        guardianData: currentUser.role === 'GUARDIAN' ? {
          address: roleData.address,
        } : undefined,
      });

      await publishEvent('user.updated', user);

      res.json(createSuccessResponse(user));
    } catch (error: any) {
      next(error);
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.user!;
      const { currentPassword, newPassword } = req.body;
      const user = await UserModel.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new AppError('Invalid current password', 401);
      }
      const updatedUser = await UserModel.update(id, { password: newPassword });
      res.json(createSuccessResponse(updatedUser));
    } catch (error: any) {
      next(error);
    }
  },

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await PasswordResetTokenModel.create({ userId: user.id, token, expiresAt });

      const notificationService = new NotificationService();
      const base = await notificationService.createNotification({
        userId: user.id,
        title: 'Password Reset Request',
        message: 'Use the provided token to reset your password.',
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM
      });

      await notificationService.sendEmailNotification({
        ...base,
        email: user.email,
        subject: 'Password Reset',
        htmlContent: `<p>Your password reset token is: <strong>${token}</strong></p>`
      });

      res.json(createSuccessResponse({ message: 'Password reset email sent' }));
    } catch (error: any) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new AppError('Token and newPassword are required', 400);
      }

      const record = await PasswordResetTokenModel.findByToken(token);
      if (!record) {
        throw new AppError('Invalid or expired token', 400);
      }

      await UserModel.update(record.userId, { password: newPassword });
      await PasswordResetTokenModel.delete(record.id);

      res.json(createSuccessResponse({ message: 'Password reset successful' }));
    } catch (error: any) {
      next(error);
    }
  },

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await UserModel.getAllUsers();
      res.json(createSuccessResponse(users));
    } catch (error: any) {
      next(error);
    }
  },

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      res.json(createSuccessResponse(user));
    } catch (error: any) {
      next(error);
    }
  },

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, ...data } = req.body;
      const user = await UserModel.update(id, {
        role: role ? mapSharedRoleToPrisma(role) : undefined,
        ...data,
      });

      await publishEvent('user.updated', user);

      res.json(createSuccessResponse(user));
    } catch (error: any) {
      next(error);
    }
  },

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserModel.delete(id);
      await publishEvent('user.deleted', { id });

      res.status(204).send();
    } catch (error: any) {
      next(error);
    }
  }
};

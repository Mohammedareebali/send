import { Request, Response } from 'express';
import { UserModel } from '../../data/models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole, DriverData, PAData, GuardianData } from '@shared/types';
import { mapPrismaRoleToShared, mapSharedRoleToPrisma } from '../../data/mappers/user.mapper';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export const UserController = {
  async register(req: Request, res: Response) {
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

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, role: mapPrismaRoleToShared(user.role) },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );
      res.json({ token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { id } = req.user!;
      const { firstName, lastName, ...roleData } = req.body;
      
      // Get current user to check role
      const currentUser = await UserModel.findById(id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
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

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { id } = req.user!;
      const { currentPassword, newPassword } = req.body;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid current password' });
      }
      const updatedUser = await UserModel.update(id, { password: newPassword });
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getUserById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role, ...data } = req.body;
      const user = await UserModel.update(id, {
        role: role ? mapSharedRoleToPrisma(role) : undefined,
        ...data,
      });
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await UserModel.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}; 
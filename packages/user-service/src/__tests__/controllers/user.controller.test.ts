import { Request, Response } from 'express';
import { UserController } from '../../api/controllers/user.controller';
import { UserModel } from '../../data/models/user.model';
import { publishEvent } from '../../infra/eventBus';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@shared/types/user';

jest.mock('../../data/models/user.model');
jest.mock('../../infra/eventBus', () => ({ publishEvent: jest.fn() }));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates a user and returns 201', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'pass',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.DRIVER,
        licenseNumber: '123',
        licenseExpiry: '2025-01-01'
      };
      const created = { id: '1', ...userData };
      req.body = userData;
      mockedUserModel.create.mockResolvedValue(created as any);

      await UserController.register(req as Request, res as Response);

      expect(mockedUserModel.create).toHaveBeenCalled();
      expect(publishEvent).toHaveBeenCalledWith('user.created', created);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: created })
      );
    });
  });

  describe('login', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    it('returns token for valid credentials', async () => {
      const user = { id: '1', email: 't@example.com', password: 'hashed', role: UserRole.DRIVER, loginCount: 0 };
      req.body = { email: 't@example.com', password: 'pw' };
      mockedUserModel.findByEmail.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(true as any);
      mockedUserModel.update.mockResolvedValue(user as any);
      mockedJwt.sign.mockReturnValue('token');

      await UserController.login(req as Request, res as Response);

      expect(mockedUserModel.findByEmail).toHaveBeenCalledWith('t@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('pw', 'hashed');
      expect(publishEvent).toHaveBeenCalledWith('user.login', { id: user.id, email: user.email });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { token: 'token' } })
      );
    });

    it('returns 401 for invalid credentials', async () => {
      req.body = { email: 'x', password: 'pw' };
      mockedUserModel.findByEmail.mockResolvedValue(null as any);

      await UserController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'AppError', message: 'Invalid credentials' }
      });
    });
  });
});

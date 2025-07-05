import { User } from '../../data/entities/User';
import { UserRepository } from '../../data/repositories/UserRepository';
import { AppError } from '@shared/errors';
import { config } from '../../config';
import * as jwt from 'jsonwebtoken';

interface UserData {
  email: string;
  password: string;
  [key: string]: any;
}

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is deactivated');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async register(userData: UserData): Promise<User> {
    if (!userData.email) {
      throw new AppError(400, 'Email is required');
    }

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  public generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      roles: [user.role],
    };

    const options: jwt.SignOptions = {
      expiresIn: '24h'
    };

    return jwt.sign(payload, config.jwt.secret as jwt.Secret, options);
  }

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret as jwt.Secret) as {
        id: string;
        email: string;
        roles: string[];
      };

      const user = await this.userRepository.findOne({ where: { id: decoded.id } });
      if (!user) {
        throw new AppError(401, 'User not found');
      }

      return user;
    } catch (error) {
      throw new AppError(401, 'Invalid token');
    }
  }
} 
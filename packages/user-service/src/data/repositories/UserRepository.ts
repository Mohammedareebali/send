import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/User';
import { AppDataSource } from '../data-source';

export class UserRepository extends Repository<User> {
  constructor() {
    super(User, AppDataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.findOne({ where: { email } });
    return user || undefined;
  }

  async findActiveDrivers(): Promise<User[]> {
    return this.find({
      where: {
        role: UserRole.DRIVER,
        isActive: true,
      },
    });
  }

  async findActivePAs(): Promise<User[]> {
    return this.find({
      where: {
        role: UserRole.PA,
        isActive: true,
      },
    });
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User | undefined> {
    await this.update(id, { isActive });
    const user = await this.findOne({ where: { id } });
    return user || undefined;
  }
} 
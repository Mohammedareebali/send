import { PrismaClient } from '../../../prisma/generated/client';

const prisma = new PrismaClient();

export const RefreshTokenModel = {
  async create(data: { userId: string; token: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  async findValid(token: string) {
    return prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      }
    });
  },

  async delete(id: string) {
    return prisma.refreshToken.delete({ where: { id } });
  }
};

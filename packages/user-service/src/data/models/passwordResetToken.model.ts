import { PrismaClient } from '../../../prisma/generated/client';

const prisma = new PrismaClient();

export const PasswordResetTokenModel = {
  async create(data: { userId: string; token: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({ data });
  },

  async findByToken(token: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      }
    });
  },

  async delete(id: string) {
    return prisma.passwordResetToken.delete({ where: { id } });
  }
};

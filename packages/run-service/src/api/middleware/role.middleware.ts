import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/types/user';

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const roles = (req.user as any).roles || [ (req.user as any).role ];
    const hasRole = roles.some((r: any) => allowedRoles.includes(r as UserRole));
    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}; 
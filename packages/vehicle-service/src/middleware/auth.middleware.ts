import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { serviceConfig } from '../config';

declare global {
  namespace Express {
    interface Request {
      user?: unknown;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  try {
    const secret = serviceConfig.security.jwtSecret;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

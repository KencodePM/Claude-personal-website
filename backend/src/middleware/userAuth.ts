import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface UserAuthPayload {
  userId: string;
  email: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      portfolioUser?: UserAuthPayload;
    }
  }
}

export function requireUserAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.USER_JWT_SECRET) as UserAuthPayload;
    req.portfolioUser = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Unauthorized: Token expired' });
    } else {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
  }
}

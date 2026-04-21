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
  // Accept token from either the Authorization header (legacy localStorage
  // clients) or the `portfolio_user_token` httpOnly cookie (PRD-preferred
  // flow). Cookie wins if both are present — the cookie is the canonical
  // session in the new flow.
  const cookieToken = req.cookies?.portfolio_user_token as string | undefined;
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    return;
  }

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

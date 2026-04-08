import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token is required' });
      return;
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      { algorithms: ['HS256'] }
    ) as { userId: string; email: string };

    req.user = {
      userId: payload.userId,
      email: payload.email
    };

    next();

  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
};
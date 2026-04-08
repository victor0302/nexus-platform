import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Blocks the none-algorithm attack by rejecting any JWT
// that doesn't explicitly use HS256
export const validateTokenAlgorithm = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || typeof decoded === 'string') {
      return false;
    }

    if (decoded.header.alg !== 'HS256') {
      console.warn(`Rejected token with algorithm: ${decoded.header.alg}`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

// Rate limiting store — tracks requests per IP
const requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  const current = requestCounts.get(ip);

  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    res.status(429).json({
      error: 'Too many requests, please try again later'
    });
    return;
  }

  current.count++;
  next();
};

// Security headers middleware
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};
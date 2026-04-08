import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createUser, findUserByEmail, findUserById } from '../models/user';
import { addToBlacklist, isBlacklisted } from '../models/tokenBlacklist';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = createUser({
      id: uuidv4(),
      email,
      passwordHash,
      createdAt: new Date()
    });

    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET as string,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });

 } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET as string,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    if (isBlacklisted(refreshToken)) {
      res.status(401).json({ error: 'Refresh token has been revoked' });
      return;
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { userId: string };

    const user = findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });

  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    addToBlacklist(refreshToken);

    res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

export default router;
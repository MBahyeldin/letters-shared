import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { createSession, deleteSession } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Simple password hashing using crypto (no external deps)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1),
  token: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }

    const { username, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { 
        username,
        deletedAt: null,
      },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    
    // Store session
    createSession(sessionToken, user.id, user.username);
    
    // Set HTTP-only cookie (7 days expiry)
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/',
    });

    // Return user info (without password hash)
    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  const sessionToken = req.cookies?.session;
  
  if (sessionToken) {
    deleteSession(sessionToken);
  }
  
  res.clearCookie('session', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});


// POST /api/auth/register (optional, for testing purposes)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }

    const { username, password, token } = result.data;

    // Verify API token
    if (token !== process.env.API_TOKEN) {
      res.status(403).json({ error: 'Invalid API token' });
      return;
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
      },
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      createdAt: newUser.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
export { hashPassword };

import { Request, Response, NextFunction } from 'express';

// In-memory session store (use Redis/DB in production)
const sessions = new Map<string, { userId: string; username: string; createdAt: Date }>();

export function createSession(token: string, userId: string, username: string): void {
  sessions.set(token, { userId, username, createdAt: new Date() });
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string) {
  return sessions.get(token);
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionToken = req.cookies?.session;

  if (!sessionToken) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = sessions.get(sessionToken);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  // Attach user to request
  req.user = {
    id: session.userId,
    username: session.username,
  };

  next();
}

// Optional auth - doesn't fail if not logged in
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionToken = req.cookies?.session;

  if (sessionToken) {
    const session = sessions.get(sessionToken);
    if (session) {
      req.user = {
        id: session.userId,
        username: session.username,
      };
    }
  }

  next();
}

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db';
import { User } from '../types';

const SECRET_KEY = process.env.JWT_SECRET || 'aistudio-intercom-support-secret-key-super-durable-2026';

// Extend Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Simple but structurally sound secure JSON Web Token implementation using built-in Node crypto (avoids version dependency issues!)
export function signToken(payload: Record<string, any>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  
  const payloadB64 = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours expiry
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function decodeAndVerifyToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;

    // Check signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    
    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

// Express JWT Auth Middleware
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or invalid format' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = decodeAndVerifyToken(token);

  if (!payload || !payload.id) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = dbStore.getUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: 'User associated with this token not found' });
    return;
  }

  req.user = user;
  next();
}

// Role Validation Middleware
export function requireRole(allowedRoles: ('customer' | 'agent' | 'admin')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: No active credentials' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: require one of roles [${allowedRoles.join(', ')}]` });
      return;
    }

    next();
  };
}

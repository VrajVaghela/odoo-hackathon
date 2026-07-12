import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool.js';
import { hashSessionToken } from '../shared/utils/crypto.js';
import { AuthenticationError, AuthorizationError } from '../shared/errors/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Utility to parse cookies from Request headers.
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    const value = parts.slice(1).join('=')?.trim();
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

/**
 * Middleware that authenticates a request using the opaque session token in cookies.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['session_token'];

    if (!token) {
      throw new AuthenticationError('No session token provided.');
    }

    const tokenHash = hashSessionToken(token);

    // Query database for valid session
    const [rows] = await pool.query(
      `SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, r.code as role_code
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE s.token_hash = ? AND u.is_active = 1`,
      [tokenHash]
    );

    const sessionData = (rows as any[])[0];

    if (!sessionData) {
      throw new AuthenticationError('Session is invalid or user is inactive.');
    }

    // Check expiry
    const expiry = new Date(sessionData.expires_at);
    if (expiry.getTime() < Date.now()) {
      // Clean up expired session asynchronously
      pool.query('DELETE FROM sessions WHERE id = ?', [sessionData.session_id]).catch(console.error);
      throw new AuthenticationError('Session has expired.');
    }

    req.user = {
      id: Number(sessionData.user_id),
      email: sessionData.email,
      role: sessionData.role_code,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware generator that restricts access to specific roles.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AuthorizationError(`Access denied. Role ${req.user.role} is not permitted.`));
      return;
    }

    next();
  };
}

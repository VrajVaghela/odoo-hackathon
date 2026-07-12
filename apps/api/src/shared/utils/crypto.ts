import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using PBKDF2/scrypt with a random salt.
 * Returns the hash in `salt:hash` format.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against an existing hash using a timing-safe comparison.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  if (!salt || !key) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}

/**
 * Generates a random opaque session token.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hashes a session token for storage.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}


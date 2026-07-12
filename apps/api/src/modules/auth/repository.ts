import pool from '../../db/pool.js';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  is_active: boolean;
  failed_login_count: number;
  lock_until: string | null;
  role_code: string;
}

export class AuthRepository {
  /**
   * Finds a user by email, normalising it to lowercase.
   */
  async findUserByEmail(email: string): Promise<UserRow | null> {
    const normalised = email.trim().toLowerCase();
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, u.failed_login_count, u.lock_until, r.code as role_code
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [normalised]
    );
    const user = (rows as any[])[0];
    return user ? (user as UserRow) : null;
  }

  /**
   * Inserts a session record for a user.
   */
  async createSession(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
  }

  /**
   * Deletes a session by its token hash (logout).
   */
  async deleteSession(tokenHash: string): Promise<void> {
    await pool.query('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
  }

  /**
   * Tracks a failed login attempt.
   */
  async incrementFailedLogins(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = ?',
      [userId]
    );
  }

  /**
   * Locks a user's account for a specified duration.
   */
  async lockAccount(userId: number, lockUntil: Date): Promise<void> {
    await pool.query(
      'UPDATE users SET lock_until = ? WHERE id = ?',
      [lockUntil, userId]
    );
  }

  /**
   * Resets login counters upon successful authentication.
   */
  async resetFailedLogins(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET failed_login_count = 0, lock_until = NULL WHERE id = ?',
      [userId]
    );
  }

  /**
   * Inserts a new user record.
   */
  async createUser(email: string, roleId: number, passwordHash: string): Promise<UserRow> {
    const normalised = email.trim().toLowerCase();
    const [result] = await pool.query(
      'INSERT INTO users (role_id, email, password_hash, is_active) VALUES (?, ?, ?, 1)',
      [roleId, normalised, passwordHash]
    );
    const insertId = (result as any).insertId;
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, u.failed_login_count, u.lock_until, r.code as role_code
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [insertId]
    );
    const user = (rows as any[])[0];
    if (!user) {
      throw new Error('Failed to retrieve newly created user.');
    }
    return user as UserRow;
  }
}


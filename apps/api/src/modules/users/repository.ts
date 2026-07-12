import pool from '../../db/pool.js';

export interface InvitationRow {
  id: number;
  user_id: number;
  token: string;
  invited_by: number;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  email: string;
  role_label: string;
  role_code: string;
  is_active: boolean;
}

export interface RoleRow {
  id: number;
  code: string;
  label: string;
}

export class UserManagementRepository {
  /**
   * Creates a new user with is_active = 0 (inactive until confirmed).
   */
  async createInactiveUser(email: string, roleId: number, passwordHash: string): Promise<number> {
    const normalised = email.trim().toLowerCase();
    const [result] = await pool.query(
      'INSERT INTO users (role_id, email, password_hash, is_active) VALUES (?, ?, ?, 0)',
      [roleId, normalised, passwordHash]
    );
    return (result as any).insertId;
  }

  /**
   * Stores an invitation record.
   */
  async createInvitation(userId: number, token: string, invitedBy: number, expiresAt: Date): Promise<void> {
    await pool.query(
      'INSERT INTO invitations (user_id, token, invited_by, expires_at) VALUES (?, ?, ?, ?)',
      [userId, token, invitedBy, expiresAt]
    );
  }

  /**
   * Finds an invitation by its confirmation token, joining user and role data.
   */
  async findInvitationByToken(token: string): Promise<InvitationRow | null> {
    const [rows] = await pool.query(
      `SELECT i.id, i.user_id, i.token, i.invited_by, i.expires_at, i.accepted_at, i.created_at,
              u.email, u.is_active, r.label as role_label, r.code as role_code
       FROM invitations i
       JOIN users u ON i.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE i.token = ?`,
      [token]
    );
    const row = (rows as any[])[0];
    return row ? (row as InvitationRow) : null;
  }

  /**
   * Sets a user's is_active flag to 1.
   */
  async activateUser(userId: number): Promise<void> {
    await pool.query('UPDATE users SET is_active = 1 WHERE id = ?', [userId]);
  }

  /**
   * Marks an invitation as accepted.
   */
  async markInvitationAccepted(invitationId: number): Promise<void> {
    await pool.query('UPDATE invitations SET accepted_at = NOW() WHERE id = ?', [invitationId]);
  }

  /**
   * Lists all invitations with user and role information for the admin view.
   */
  async listInvitations(): Promise<InvitationRow[]> {
    const [rows] = await pool.query(
      `SELECT i.id, i.user_id, i.token, i.invited_by, i.expires_at, i.accepted_at, i.created_at,
              u.email, u.is_active, r.label as role_label, r.code as role_code
       FROM invitations i
       JOIN users u ON i.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       ORDER BY i.created_at DESC`
    );
    return rows as InvitationRow[];
  }

  /**
   * Lists all available roles.
   */
  async listRoles(): Promise<RoleRow[]> {
    const [rows] = await pool.query('SELECT id, code, label FROM roles ORDER BY id');
    return rows as RoleRow[];
  }

  /**
   * Checks if an email is already registered.
   */
  async findUserByEmail(email: string): Promise<any | null> {
    const normalised = email.trim().toLowerCase();
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [normalised]);
    const row = (rows as any[])[0];
    return row || null;
  }
}

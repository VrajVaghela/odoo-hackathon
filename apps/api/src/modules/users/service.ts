import { randomBytes } from 'node:crypto';
import { UserManagementRepository } from './repository.js';
import { hashPassword } from '../../shared/utils/crypto.js';
import { sendInvitationEmail } from '../../shared/services/email.js';
import { BusinessRuleViolationError } from '../../shared/errors/index.js';

export class UserManagementService {
  private repo: UserManagementRepository;

  constructor() {
    this.repo = new UserManagementRepository();
  }

  /**
   * Creates an inactive user, generates a confirmation token, and sends an invitation email.
   */
  async inviteUser(email: string, roleId: number, invitedByUserId: number) {
    const normalised = email.trim().toLowerCase();

    // Check if email is already registered
    const existing = await this.repo.findUserByEmail(normalised);
    if (existing) {
      throw new BusinessRuleViolationError('DUPLICATE_EMAIL', 'A user with this email already exists.');
    }

    // Create inactive user with a random password hash (they'll use Google OAuth or reset later)
    const dummyPassword = randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(dummyPassword);
    const userId = await this.repo.createInactiveUser(normalised, roleId, passwordHash);

    // Generate secure confirmation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await this.repo.createInvitation(userId, token, invitedByUserId, expiresAt);

    // Build confirmation URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const confirmUrl = `${frontendUrl}?confirm=${token}`;

    // Fetch role label for email
    const roles = await this.repo.listRoles();
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.label : 'Team Member';

    // Send invitation email
    await sendInvitationEmail(normalised, confirmUrl, roleName);

    return { email: normalised, role: roleName, expiresAt };
  }

  /**
   * Validates a confirmation token and activates the user's account.
   */
  async confirmInvitation(token: string) {
    const invitation = await this.repo.findInvitationByToken(token);

    if (!invitation) {
      throw new BusinessRuleViolationError('INVALID_TOKEN', 'Invalid or unknown invitation token.');
    }

    if (invitation.accepted_at) {
      throw new BusinessRuleViolationError('ALREADY_ACCEPTED', 'This invitation has already been accepted.');
    }

    const expiry = new Date(invitation.expires_at);
    if (expiry.getTime() < Date.now()) {
      throw new BusinessRuleViolationError('INVITATION_EXPIRED', 'This invitation has expired. Please ask your administrator to send a new one.');
    }

    // Activate the user
    await this.repo.activateUser(invitation.user_id);
    await this.repo.markInvitationAccepted(invitation.id);

    return { email: invitation.email, role: invitation.role_label };
  }

  /**
   * Returns all invitations for the admin view.
   */
  async listInvitations() {
    return this.repo.listInvitations();
  }

  /**
   * Returns all available roles.
   */
  async listRoles() {
    return this.repo.listRoles();
  }
}

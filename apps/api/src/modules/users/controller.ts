import { Request, Response, NextFunction } from 'express';
import { UserManagementService } from './service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export class UserManagementController {
  private service: UserManagementService;

  constructor() {
    this.service = new UserManagementService();
  }

  /**
   * POST /api/v1/users/invite — Admin sends an invitation to a new user.
   */
  invite = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, role_id } = req.body;

      if (!email || !role_id) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Email and role_id are required.' },
        });
        return;
      }

      const result = await this.service.inviteUser(email, Number(role_id), req.user!.id);
      res.status(201).json({
        message: `Invitation sent to ${result.email}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users/confirm/:token — Public endpoint to confirm an invitation.
   */
  confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Confirmation token is required.' },
        });
        return;
      }

      const result = await this.service.confirmInvitation(token);
      res.status(200).json({
        message: `Account activated successfully for ${result.email}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users/invitations — Admin lists all invitations.
   */
  listInvitations = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invitations = await this.service.listInvitations();
      res.status(200).json({ data: invitations });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users/roles — Returns all available roles for the invite form dropdown.
   */
  listRoles = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.service.listRoles();
      res.status(200).json({ data: roles });
    } catch (err) {
      next(err);
    }
  };
}

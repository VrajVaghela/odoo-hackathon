import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export class AuthController {
  private authService = new AuthService();

  /**
   * HTTP Handler for login. Verifies credentials and sets session cookie.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required.',
          },
        });
        return;
      }

      const { token, user } = await this.authService.login(email, password);

      // Set cookie containing opaque token
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for logout. Cleans up session from DB and deletes cookie.
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Find session token from cookies
      const cookieHeader = req.headers.cookie || '';
      const tokenMatch = cookieHeader.match(/session_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        await this.authService.logout(token);
      }

      res.clearCookie('session_token');
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for retrieving current user session details.
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not logged in.',
          },
        });
        return;
      }

      res.status(200).json({ user: req.user });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler to initiate Google OAuth login.
   */
  google = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        res.status(500).json({
          error: {
            code: 'OAUTH_MISCONFIGURED',
            message: 'Google Client ID or Redirect URI is missing on the server.',
          },
        });
        return;
      }

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=oauth_state`;
      res.redirect(googleAuthUrl);
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP Handler for Google OAuth redirect callback.
   */
  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      const { code, error: oauthError } = req.query;

      if (oauthError) {
        res.redirect(`${frontendUrl}?error=${encodeURIComponent(String(oauthError))}`);
        return;
      }

      if (!code) {
        res.redirect(`${frontendUrl}?error=${encodeURIComponent('No authorization code provided from Google.')}`);
        return;
      }

      const { token, user } = await this.authService.verifyGoogleCodeAndLogin(String(code));

      // Set cookie containing opaque token
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.redirect(frontendUrl);
    } catch (err: any) {
      const errorMessage = err.message || 'OAuth authentication failed.';
      res.redirect(`${frontendUrl}?error=${encodeURIComponent(errorMessage)}`);
    }
  };
}


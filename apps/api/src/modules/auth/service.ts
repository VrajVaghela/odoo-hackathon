import { AuthRepository } from './repository.js';
import { verifyPassword, hashPassword, generateSessionToken, hashSessionToken } from '../../shared/utils/crypto.js';
import { AuthenticationError, BusinessRuleViolationError } from '../../shared/errors/index.js';

export class AuthService {
  private authRepository = new AuthRepository();

  /**
   * Logs a user in, handles password hashing comparison, failed attempt tracking, and session creation.
   */
  async login(email: string, password: string): Promise<{ token: string; user: { email: string; role: string } }> {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      // Return generic error to prevent email harvesting
      throw new AuthenticationError('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new AuthenticationError('This user account is inactive.');
    }

    // Check account lock status
    if (user.lock_until) {
      const lockTime = new Date(user.lock_until);
      if (lockTime.getTime() > Date.now()) {
        const minutesLeft = Math.ceil((lockTime.getTime() - Date.now()) / 60000);
        throw new BusinessRuleViolationError(
          'ACCOUNT_LOCKED',
          `Too many failed login attempts. Account is locked. Try again in ${minutesLeft} minute(s).`
        );
      } else {
        // Lock expired, reset it
        await this.authRepository.resetFailedLogins(user.id);
        user.failed_login_count = 0;
      }
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      // Track failed attempt
      const attempts = user.failed_login_count + 1;
      await this.authRepository.incrementFailedLogins(user.id);

      if (attempts >= 5) {
        // Lock for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.authRepository.lockAccount(user.id, lockUntil);
        throw new BusinessRuleViolationError(
          'ACCOUNT_LOCKED',
          'Too many failed login attempts. Account has been locked for 15 minutes.'
        );
      }

      throw new AuthenticationError('Invalid email or password.');
    }

    // Success, reset login counters
    await this.authRepository.resetFailedLogins(user.id);

    // Create session token
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    await this.authRepository.createSession(user.id, tokenHash, expiresAt);

    return {
      token,
      user: {
        email: user.email,
        role: user.role_code,
      },
    };
  }

  /**
   * Logs a user out by removing their session from the database.
   */
  async logout(token: string): Promise<void> {
    const tokenHash = hashSessionToken(token);
    await this.authRepository.deleteSession(tokenHash);
  }

  /**
   * Exchanges authorization code for tokens, retrieves profile, maps user, and returns session token.
   */
  async verifyGoogleCodeAndLogin(code: string): Promise<{ token: string; user: { email: string; role: string } }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth is not configured on the server (missing client ID, secret, or redirect URI).');
    }

    // 1. Exchange auth code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const tokenData = (await tokenResponse.json()) as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Google did not return an access token.');
    }

    // 2. Fetch user profile information
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      throw new Error(`Failed to fetch Google userinfo: ${errorText}`);
    }

    const userInfo = (await userInfoResponse.json()) as any;
    const email = userInfo.email;

    if (!email) {
      throw new Error('Failed to retrieve user email from Google.');
    }

    // 3. Find user in the database
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new AuthenticationError('This Google account is not registered in the system.');
    }

    if (!user.is_active) {
      throw new AuthenticationError('This user account is inactive.');
    }

    // 4. Create session token
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    await this.authRepository.createSession(user.id, tokenHash, expiresAt);

    return {
      token,
      user: {
        email: user.email,
        role: user.role_code,
      },
    };
  }
}


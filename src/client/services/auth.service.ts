/**
 * Authentication Service
 * Handles admin authentication and authorization
 */

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class AuthService {
  private user: User | null = null;
  private token: string | null = null;
  private readonly TOKEN_KEY = 'webos_auth_token';
  private readonly USER_KEY = 'webos_user';

  constructor() {
    // Restore session from localStorage
    this.restoreSession();
  }

  /**
   * Restore authentication session from localStorage
   */
  private restoreSession(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);

      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to restore auth session:', error);
      this.clearSession();
    }
  }

  /**
   * Save authentication session to localStorage
   */
  private saveSession(user: User, token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.user = user;
      this.token = token;
    } catch (error) {
      console.error('Failed to save auth session:', error);
    }
  }

  /**
   * Clear authentication session
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.user = null;
    this.token = null;
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.session && data.session.user && data.session.token) {
        const user: User = {
          id: data.session.user.id,
          username: data.session.user.username,
          role: data.session.user.role,
          email: data.session.user.email,
        };
        this.saveSession(user, data.session.token);
        return {
          success: true,
          user: user,
          token: data.session.token,
        };
      }

      return {
        success: false,
        message: data.error || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error during login',
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.user !== null && this.token !== null;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get headers with authentication token
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Verify current token is still valid
   */
  async verifyToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearSession();
      return false;
    }
  }
}

export const authService = new AuthService();

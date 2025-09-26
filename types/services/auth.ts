export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  /**
   * JWT access token that should be used for authenticated requests.
   */
  access: string;
  /**
   * Refresh token that can be exchanged for a new access token when it expires.
   */
  refresh: string;
  /**
   * Optional legacy token field kept for backwards compatibility with older APIs.
   */
  token?: string;
  success?: boolean;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

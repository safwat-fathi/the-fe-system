export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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

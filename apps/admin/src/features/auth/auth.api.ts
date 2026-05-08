import { apiClient } from '@shared/api/client';
import type { AuthUser } from '@store/auth.store';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export const authApi = {
  login: (body: LoginRequest) => apiClient.post<LoginResponse>('/login', body),
  signUp: (body: SignUpRequest) => apiClient.post<{ message: string }>('/sign-in', body),
  logout: () => apiClient.post<{ message: string }>('/logout'),
  forgotPassword: (email: string) =>
    apiClient.post<ForgotPasswordResponse>('/forgot-password', { email }),
  verifyOtp: (email: string, userOtp: string) =>
    apiClient.post<{ message: string }>('/verify-otp', { email, userOtp }),
  resetPassword: (email: string, password: string) =>
    apiClient.post<{ message: string }>('/reset-password', { email, password }),
};

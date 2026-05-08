import type { UserRole } from '../types/user-role';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  driverId?: string;
  phone?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  driverId?: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

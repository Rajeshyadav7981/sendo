import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../modules/auth/types/user-role';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

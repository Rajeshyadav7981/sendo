import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthUser } from '../../modules/auth/interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return req.user;
  },
);

import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

export const TRACKER_PASSWORD_FALLBACK = 'tracker123';
export const SKIP_EMP_AUTH_KEY = 'skipEmpAuth';

export const SkipEmpAuth = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_EMP_AUTH_KEY, true);

export function trackerPassword(): string {
  return process.env.EMPLOYEE_TRACKER_PASSWORD ?? TRACKER_PASSWORD_FALLBACK;
}

@Injectable()
export class EmpPasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_EMP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const provided = (req.headers['x-emp-password'] ?? '') as string;
    if (provided !== trackerPassword()) {
      throw new UnauthorizedException('Invalid employee password');
    }
    return true;
  }
}

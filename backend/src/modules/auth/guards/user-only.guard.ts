import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ONLY_KEY } from '../decorators/user-only.decorator';

@Injectable()
export class UserOnlyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isUserOnly = this.reflector.getAllAndOverride<boolean>(USER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isUserOnly) {
      return true; // If not marked as user-only, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Allow regular users and market makers
    if (user.role !== 'user' && user.role !== 'market_maker') {
      throw new ForbiddenException('This endpoint is only available for users/market makers. Operators and admins cannot access this resource.');
    }

    return true;
  }
}


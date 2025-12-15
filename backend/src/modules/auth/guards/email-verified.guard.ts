import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Operators don't need email verification (they are internal employees)
    if (user.role === 'operator' || user.role === 'admin') {
      return true;
    }

    const userEntity = await this.usersService.findById(user.userId);

    if (!userEntity.emailVerified) {
      throw new ForbiddenException('Email verification required. Please verify your email address.');
    }

    return true;
  }
}


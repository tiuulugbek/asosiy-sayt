import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class ApiKeyOrJwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'Authorization: Bearer token talab qilinadi',
      });
    }

    // API key (64 hex) — JWT emas
    if (/^[a-f0-9]{64}$/i.test(token)) {
      const user = await this.authService.validateApiToken(token);
      if (!user) {
        throw new UnauthorizedException({
          error: 'Unauthorized',
          message: 'API token noto\'g\'ri yoki muddati tugagan',
        });
      }
      request.user = user;
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'Autentifikatsiya muvaffaqiyatsiz',
      });
    }
    return user;
  }
}

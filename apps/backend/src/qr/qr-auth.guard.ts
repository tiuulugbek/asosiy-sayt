import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { QrJwtPayload } from './qr.types';

@Injectable()
export class QrAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.qr_access_token;
    if (!token) {
      throw new UnauthorizedException('QR authentication required');
    }

    let payload: QrJwtPayload;
    try {
      payload = this.jwtService.verify<QrJwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid QR auth token');
    }

    const account = await this.prisma.qrAccessAccount.findUnique({
      where: { id: payload.sub },
    });

    if (!account || !account.isActive) {
      throw new UnauthorizedException('QR account inactive or missing');
    }

    req.qrUser = {
      ...payload,
      accountId: account.id,
    };
    return true;
  }
}

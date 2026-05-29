import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { QrRequestUser } from './qr.types';

export const CurrentQrUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): QrRequestUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.qrUser as QrRequestUser | undefined;
  },
);

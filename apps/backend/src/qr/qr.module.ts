import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { QrAuthGuard } from './qr-auth.guard';

@Module({
  imports: [JwtModule],
  controllers: [QrController],
  providers: [QrService, QrAuthGuard],
  exports: [QrService],
})
export class QrModule {}

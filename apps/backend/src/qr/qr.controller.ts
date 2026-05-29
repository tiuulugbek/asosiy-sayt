import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QrService } from './qr.service';
import { Public } from '../common/decorators/public.decorator';
import { QrAuthGuard } from './qr-auth.guard';
import { CurrentQrUser } from './current-qr-user.decorator';
import { QrRequestUser } from './qr.types';

@Controller()
export class QrController {
  constructor(
    private readonly qrService: QrService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('qr-auth/login')
  async login(@Body() body: { branchId: string; password: string }, @Res({ passthrough: true }) res: any) {
    const account = await this.qrService.login(body);
    const payload = {
      sub: account.id,
      loginType: account.loginType,
      branchId: account.branchId,
      displayName: account.displayName,
    };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '1d',
    });
    res.cookie('qr_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return { ok: true };
  }

  @UseGuards(QrAuthGuard)
  @Post('qr-auth/logout')
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('qr_access_token');
    return { ok: true };
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-auth/me')
  me(@CurrentQrUser() user: QrRequestUser) {
    return this.qrService.me(user);
  }

  @Public()
  @Get('qr/branches')
  branches() {
    return this.qrService.listBranches();
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-codes')
  listQrs(@CurrentQrUser() user: QrRequestUser, @Query() q: any) {
    return this.qrService.listQrs(user, {
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      branchId: q.branchId,
      qrCodeId: q.qrCodeId ? Number(q.qrCodeId) : undefined,
      destinationUrl: q.destinationUrl,
      status: q.status,
      campaignName: q.campaignName,
    });
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-access/accounts')
  accounts(@CurrentQrUser() user: QrRequestUser) {
    return this.qrService.listAccessAccounts(user);
  }

  @UseGuards(QrAuthGuard)
  @Post('qr-access/accounts')
  createAccount(@CurrentQrUser() user: QrRequestUser, @Body() body: any) {
    return this.qrService.createAccessAccount(user, body);
  }

  @UseGuards(QrAuthGuard)
  @Patch('qr-access/accounts/:id/active')
  setAccountActive(@CurrentQrUser() user: QrRequestUser, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.qrService.setAccessActive(user, Number(id), !!body.isActive);
  }

  @UseGuards(QrAuthGuard)
  @Patch('qr-access/accounts/:id/password')
  resetPassword(@CurrentQrUser() user: QrRequestUser, @Param('id') id: string, @Body() body: { password: string }) {
    return this.qrService.resetAccessPassword(user, Number(id), body.password);
  }

  @UseGuards(QrAuthGuard)
  @Post('qr-codes')
  createQr(@CurrentQrUser() user: QrRequestUser, @Body() body: any) {
    return this.qrService.createQr(user, body);
  }

  @UseGuards(QrAuthGuard)
  @Patch('qr-codes/:id')
  updateQr(@CurrentQrUser() user: QrRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.qrService.updateQr(user, Number(id), body);
  }

  @UseGuards(QrAuthGuard)
  @Delete('qr-codes/:id')
  removeQr(@CurrentQrUser() user: QrRequestUser, @Param('id') id: string) {
    return this.qrService.deleteQr(user, Number(id));
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-codes/:code/preview')
  preview(@Param('code') code: string) {
    return this.qrService.generatePreview(code);
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-analytics/summary')
  summary(@CurrentQrUser() user: QrRequestUser, @Query() q: any) {
    return this.qrService.getSummary(user, {
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      branchId: q.branchId,
      qrCodeId: q.qrCodeId ? Number(q.qrCodeId) : undefined,
      destinationUrl: q.destinationUrl,
      status: q.status,
      campaignName: q.campaignName,
    });
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-analytics/branch-performance')
  branchPerformance(@CurrentQrUser() user: QrRequestUser) {
    return this.qrService.getBranchPerformance(user);
  }

  @UseGuards(QrAuthGuard)
  @Get('qr-analytics/landing-pages')
  landingAnalytics(@CurrentQrUser() user: QrRequestUser) {
    return this.qrService.getLandingAnalytics(user);
  }

  @Public()
  @Get('r/:code')
  redirect(@Param('code') code: string, @Req() req: any, @Res() res: any) {
    return this.qrService.handleRedirect(code, req, res);
  }
}

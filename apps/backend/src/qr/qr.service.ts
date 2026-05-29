import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrFilterInput, QrRequestUser } from './qr.types';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';

type LoginInput = { branchId: string; password: string };

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  formatDisplayId(id: number) {
    return id.toString().padStart(3, '0');
  }

  async login(input: LoginInput) {
    const branchId = input.branchId === 'super-admin' ? null : input.branchId;
    const loginType = branchId ? 'branch' : 'super_admin';
    const account = await this.prisma.qrAccessAccount.findFirst({
      where: { branchId, loginType, isActive: true },
    });

    if (!account) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(input.password, account.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.qrAccessAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    return account;
  }

  async me(user: QrRequestUser) {
    const account = await this.prisma.qrAccessAccount.findUnique({
      where: { id: user.accountId },
      include: { branch: true },
    });
    if (!account) throw new UnauthorizedException('Account not found');
    return {
      id: account.id,
      displayId: this.formatDisplayId(account.id),
      loginType: account.loginType,
      branch: account.branch,
      displayName: account.displayName,
    };
  }

  private ensureBranchScope(user: QrRequestUser, branchId: string) {
    if (user.loginType === 'branch' && user.branchId !== branchId) {
      throw new ForbiddenException('Branch scope violation');
    }
  }

  async listBranches() {
    return this.prisma.branch.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name_uz: true, name_ru: true, slug: true },
    });
  }

  async listAccessAccounts(user: QrRequestUser) {
    if (user.loginType !== 'super_admin') throw new ForbiddenException('Only super admin');
    const items = await this.prisma.qrAccessAccount.findMany({
      include: { branch: true },
      orderBy: { id: 'asc' },
    });
    return items.map((i) => ({ ...i, displayId: this.formatDisplayId(i.id) }));
  }

  async createAccessAccount(user: QrRequestUser, data: any) {
    if (user.loginType !== 'super_admin') throw new ForbiddenException('Only super admin');
    const hash = await bcrypt.hash(String(data.password), 10);
    return this.prisma.qrAccessAccount.create({
      data: {
        branchId: data.branchId || null,
        loginType: data.loginType,
        displayName: data.displayName,
        passwordHash: hash,
        isActive: data.isActive ?? true,
      },
    });
  }

  async setAccessActive(user: QrRequestUser, id: number, isActive: boolean) {
    if (user.loginType !== 'super_admin') throw new ForbiddenException('Only super admin');
    return this.prisma.qrAccessAccount.update({ where: { id }, data: { isActive } });
  }

  async resetAccessPassword(user: QrRequestUser, id: number, password: string) {
    if (user.loginType !== 'super_admin') throw new ForbiddenException('Only super admin');
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.qrAccessAccount.update({ where: { id }, data: { passwordHash } });
  }

  async createQr(user: QrRequestUser, data: any) {
    this.ensureBranchScope(user, data.branchId);
    const code = String(data.code || '').trim().toLowerCase();
    if (!code) throw new BadRequestException('Code is required');
    const exists = await this.prisma.qrCode.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('Code must be unique');

    return this.prisma.qrCode.create({
      data: {
        name: data.name,
        code,
        branchId: data.branchId,
        destinationType: data.destinationType || 'external_url',
        destinationUrl: data.destinationUrl,
        internalPagePath: data.internalPagePath || null,
        description: data.description || null,
        campaignName: data.campaignName || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        status: data.status || 'active',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdByAccountId: user.accountId,
      },
    });
  }

  async updateQr(user: QrRequestUser, id: number, data: any) {
    const qr = await this.prisma.qrCode.findUnique({ where: { id } });
    if (!qr) throw new NotFoundException('QR not found');
    this.ensureBranchScope(user, qr.branchId);
    if (data.branchId) this.ensureBranchScope(user, data.branchId);

    return this.prisma.qrCode.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt,
      },
    });
  }

  async deleteQr(user: QrRequestUser, id: number) {
    const qr = await this.prisma.qrCode.findUnique({ where: { id } });
    if (!qr) throw new NotFoundException('QR not found');
    this.ensureBranchScope(user, qr.branchId);
    return this.prisma.qrCode.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listQrs(user: QrRequestUser, filters: QrFilterInput) {
    const where: any = { deletedAt: null };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.status) where.status = filters.status;
    if (filters.qrCodeId) where.id = filters.qrCodeId;
    if (filters.destinationUrl) where.destinationUrl = { contains: filters.destinationUrl, mode: 'insensitive' };
    if (filters.campaignName) where.campaignName = { contains: filters.campaignName, mode: 'insensitive' };
    if (user.loginType === 'branch') where.branchId = user.branchId;
    const items = await this.prisma.qrCode.findMany({
      where,
      include: { branch: true, _count: { select: { scanEvents: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((i) => ({ ...i, displayId: this.formatDisplayId(i.id), totalScans: i._count.scanEvents }));
  }

  async generatePreview(code: string) {
    const target = `/r/${code}`;
    const dataUrl = await QRCode.toDataURL(target, { margin: 1, width: 256 });
    return { code, target, dataUrl };
  }

  private hashIp(ip: string) {
    return createHash('sha256').update(ip).digest('hex');
  }

  async handleRedirect(code: string, req: any, res: any) {
    const qr = await this.prisma.qrCode.findFirst({ where: { code, deletedAt: null } });
    if (!qr) throw new NotFoundException('QR code not found');
    if (qr.status !== 'active') throw new BadRequestException('QR code is not active');
    if (qr.expiresAt && qr.expiresAt < new Date()) throw new BadRequestException('QR code expired');

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const userAgent = String(req.headers['user-agent'] || '');
    const parser = new UAParser(userAgent);
    const ipHash = this.hashIp(ip);
    const uniquenessKey = `${qr.id}:${ipHash}:${userAgent}`;
    const now = new Date();
    const uniqueWindowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.qrScanEvent.findFirst({
      where: { qrCodeId: qr.id, uniquenessKey, scannedAt: { gte: uniqueWindowStart } },
    });
    const isUniqueScan = !existing;

    await this.prisma.qrScanEvent.create({
      data: {
        qrCodeId: qr.id,
        branchId: qr.branchId,
        scannedAt: now,
        ipHash,
        userAgent,
        deviceType: parser.getDevice().type || 'desktop',
        browser: parser.getBrowser().name || null,
        os: parser.getOS().name || null,
        referer: String(req.headers.referer || ''),
        destinationUrl: qr.destinationUrl,
        isUniqueScan,
        uniquenessKey,
        rawMetaJson: { headers: req.headers },
      },
    });

    return res.redirect(qr.destinationUrl);
  }

  async getSummary(user: QrRequestUser, filters: QrFilterInput) {
    const whereEvents: any = {};
    const whereQr: any = { deletedAt: null };
    if (filters.from || filters.to) {
      whereEvents.scannedAt = {};
      if (filters.from) whereEvents.scannedAt.gte = filters.from;
      if (filters.to) whereEvents.scannedAt.lte = filters.to;
    }
    if (filters.branchId) {
      whereEvents.branchId = filters.branchId;
      whereQr.branchId = filters.branchId;
    }
    if (user.loginType === 'branch') {
      whereEvents.branchId = user.branchId;
      whereQr.branchId = user.branchId;
    }

    const [totalQrCodes, activeQrCodes, totalScans, uniqueScans] = await Promise.all([
      this.prisma.qrCode.count({ where: whereQr }),
      this.prisma.qrCode.count({ where: { ...whereQr, status: 'active' } }),
      this.prisma.qrScanEvent.count({ where: whereEvents }),
      this.prisma.qrScanEvent.count({ where: { ...whereEvents, isUniqueScan: true } }),
    ]);

    return { totalQrCodes, activeQrCodes, totalScans, uniqueScans };
  }

  async getBranchPerformance(user: QrRequestUser) {
    const branches = await this.prisma.branch.findMany({
      select: { id: true, name_uz: true, name_ru: true },
      orderBy: { order: 'asc' },
    });
    const allowed = user.loginType === 'branch' ? branches.filter((b) => b.id === user.branchId) : branches;
    const rows = await Promise.all(
      allowed.map(async (branch) => {
        const [activeQrCount, totalScans, uniqueScans] = await Promise.all([
          this.prisma.qrCode.count({ where: { branchId: branch.id, status: 'active', deletedAt: null } }),
          this.prisma.qrScanEvent.count({ where: { branchId: branch.id } }),
          this.prisma.qrScanEvent.count({ where: { branchId: branch.id, isUniqueScan: true } }),
        ]);
        return { branch, activeQrCount, totalScans, uniqueScans };
      }),
    );
    return rows;
  }

  async getLandingAnalytics(user: QrRequestUser) {
    const where: any = {};
    if (user.loginType === 'branch') where.branchId = user.branchId;
    const grouped = await this.prisma.qrScanEvent.groupBy({
      by: ['destinationUrl', 'branchId'],
      where,
      _count: { _all: true },
    });
    return grouped;
  }
}

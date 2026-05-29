import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { loginSchema, changePasswordSchema } from '@acoustic/shared';
import type { LoginDto, ChangePasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = this.parseLoginInput(loginDto);
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = this.parseChangePasswordInput(changePasswordDto);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async validateApiToken(token: string) {
    const users = await this.prisma.user.findMany({
      where: { apiTokenHash: { not: null }, isActive: true },
      include: { role: true },
    });

    for (const user of users) {
      const ok = await bcrypt.compare(token, user.apiTokenHash!);
      if (ok) {
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roleId: user.roleId,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      }
    }
    return null;
  }

  async setApiToken(userId: string, plainToken: string) {
    const hash = await bcrypt.hash(plainToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { apiTokenHash: hash },
    });
  }

  async whoami(user: { id: string; role: { name: string } }) {
    return {
      id: user.id,
      name: user.role.name,
      role: user.role.name,
    };
  }

  private parseLoginInput(input: LoginDto) {
    try {
      return loginSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Login ma'lumotlari noto'g'ri",
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  private parseChangePasswordInput(input: ChangePasswordDto) {
    try {
      return changePasswordSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Parol ma'lumotlari noto'g'ri",
          errors: error.issues,
        });
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        access_token: accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

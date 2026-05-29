import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { TrafficService } from './traffic.service';

@ApiTags('admin')
@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @UseGuards(JwtAuthGuard, RbacGuard)
  @Get('report')
  @RequirePermissions('content.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get acoustic.uz traffic statistics from nginx logs' })
  getReport(@Query('days') days?: string) {
    return this.trafficService.getReport(days ? Number(days) : 15);
  }
}

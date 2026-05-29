import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('public', 'admin')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a public review (pending moderation)' })
  create(@Body() body: unknown) {
    return this.reviewsService.create(body);
  }

  @Public()
  @Get('published')
  @ApiOperation({ summary: 'List published reviews' })
  findPublished(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 50;
    return this.reviewsService.findPublished(Number.isFinite(n) ? n : 50);
  }

  @UseGuards(JwtAuthGuard, RbacGuard)
  @Get('admin')
  @RequirePermissions('reviews.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all reviews (admin)' })
  findAllAdmin() {
    return this.reviewsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RbacGuard)
  @Patch('admin/:id')
  @RequirePermissions('reviews.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review status (moderation)' })
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.reviewsService.updateStatus(id, body);
  }

  @UseGuards(JwtAuthGuard, RbacGuard)
  @Delete('admin/:id')
  @RequirePermissions('reviews.write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review (admin)' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}

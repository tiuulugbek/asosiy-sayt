import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiKeyOrJwtAuthGuard } from '../common/guards/api-key-or-jwt.guard';
import { IntegrationExceptionFilter } from '../common/filters/integration-exception.filter';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IntegrationArticlesService } from './integration-articles.service';

@ApiTags('integration')
@ApiBearerAuth()
@Controller('articles')
@UseGuards(ApiKeyOrJwtAuthGuard)
@UseFilters(IntegrationExceptionFilter)
export class IntegrationArticlesController {
  constructor(private readonly articles: IntegrationArticlesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const article = await this.articles.create(body, user);
    return article;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articles.update(id, body, user);
  }

  @Get()
  list(
    @Query('author') author: string | undefined,
    @Query('status') status: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('page') page: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articles.list(user, { author, status, limit, page });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.articles.remove(id, user);
  }
}

type AuthUser = {
  id: string;
  role: { name: string; permissions: string[] };
};

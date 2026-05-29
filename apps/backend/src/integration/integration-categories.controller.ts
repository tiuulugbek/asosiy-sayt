import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiKeyOrJwtAuthGuard } from '../common/guards/api-key-or-jwt.guard';
import { IntegrationExceptionFilter } from '../common/filters/integration-exception.filter';
import { IntegrationCategoriesService } from './integration-categories.service';

@ApiTags('integration')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(ApiKeyOrJwtAuthGuard)
@UseFilters(IntegrationExceptionFilter)
export class IntegrationCategoriesController {
  constructor(private readonly categories: IntegrationCategoriesService) {}

  @Get()
  findAll() {
    return this.categories.findAll();
  }
}

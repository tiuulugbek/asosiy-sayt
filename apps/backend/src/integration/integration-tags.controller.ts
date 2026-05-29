import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiKeyOrJwtAuthGuard } from '../common/guards/api-key-or-jwt.guard';
import { IntegrationExceptionFilter } from '../common/filters/integration-exception.filter';
import { IntegrationTagsService } from './integration-tags.service';

@ApiTags('integration')
@ApiBearerAuth()
@Controller('tags')
@UseGuards(ApiKeyOrJwtAuthGuard)
@UseFilters(IntegrationExceptionFilter)
export class IntegrationTagsController {
  constructor(private readonly tags: IntegrationTagsService) {}

  @Get()
  search(@Query('q') q?: string) {
    return this.tags.search(q);
  }
}

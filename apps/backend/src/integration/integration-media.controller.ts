import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiKeyOrJwtAuthGuard } from '../common/guards/api-key-or-jwt.guard';
import { IntegrationExceptionFilter } from '../common/filters/integration-exception.filter';
import { MediaService } from '../media/media.service';
import { UploadedFile as StoredFile } from '../media/storage/storage.service';

@ApiTags('integration')
@ApiBearerAuth()
@Controller('media/images')
@UseGuards(ApiKeyOrJwtAuthGuard)
@UseFilters(IntegrationExceptionFilter)
export class IntegrationMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
        source: { type: 'string', enum: ['ai', 'user'] },
      },
    },
  })
  async upload(
    @UploadedFile() file: StoredFile,
    @Body('alt') alt?: string,
  ) {
    const media = await this.mediaService.create(file, alt, alt);
    return {
      id: media.id,
      url: media.url,
      width: null,
      height: null,
      format: media.mimeType?.split('/')[1] || 'unknown',
    };
  }

  @Post('from-url')
  async fromUrl(@Body() body: { url: string; alt?: string }) {
    const media = await this.mediaService.createFromUrl(body.url, body.alt, body.alt);
    return {
      id: media.id,
      url: media.url,
      width: null,
      height: null,
      format: media.mimeType?.split('/')[1] || 'unknown',
    };
  }
}

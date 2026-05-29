import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, UploadedFile } from './storage/storage.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async findAll() {
    return this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async create(file: UploadedFile, alt_uz?: string, alt_ru?: string, skipWebp?: boolean) {
    try {
      this.logger.log(`Uploading file: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`);
      
      const uploadResult = await this.storageService.upload(file, skipWebp);
      
      this.logger.log(`File uploaded successfully: ${uploadResult.url}`);

      const media = await this.prisma.media.create({
        data: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          alt_uz,
          alt_ru,
        },
      });

      this.logger.log(`Media record created: ${media.id}`);
      return media;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Rasm yuklashda xatolik: ${error instanceof Error ? error.message : 'Noma\'lum xatolik'}`
      );
    }
  }

  async createFromUrl(url: string, alt_uz?: string, alt_ru?: string) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024,
      });
      const contentType = (response.headers['content-type'] as string) || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        throw new BadRequestException('URL rasm emas');
      }
      const buffer = Buffer.from(response.data);
      const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
      const file: UploadedFile = {
        originalname: `remote.${ext}`,
        mimetype: contentType,
        size: buffer.length,
        buffer,
      };
      return this.create(file, alt_uz, alt_ru);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`from-url failed: ${error instanceof Error ? error.message : 'unknown'}`);
      throw new BadRequestException(
        `Rasmni URL dan yuklab bo\'lmadi: ${error instanceof Error ? error.message : 'xatolik'}`,
      );
    }
  }

  async update(id: string, data: { alt_uz?: string; alt_ru?: string }) {
    return this.prisma.media.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const media = await this.findOne(id);

    await this.storageService.delete(media.url);

    return this.prisma.media.delete({
      where: { id },
    });
  }
}


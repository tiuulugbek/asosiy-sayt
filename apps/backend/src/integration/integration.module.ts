import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApiKeyOrJwtAuthGuard } from '../common/guards/api-key-or-jwt.guard';
import { PostsModule } from '../posts/posts.module';
import { MediaModule } from '../media/media.module';
import { IntegrationArticlesController } from './integration-articles.controller';
import { IntegrationArticlesService } from './integration-articles.service';
import { IntegrationCategoriesController } from './integration-categories.controller';
import { IntegrationCategoriesService } from './integration-categories.service';
import { IntegrationTagsController } from './integration-tags.controller';
import { IntegrationTagsService } from './integration-tags.service';
import { IntegrationMediaController } from './integration-media.controller';
import { IntegrationWebhookService } from './integration-webhook.service';

@Module({
  imports: [AuthModule, PostsModule, MediaModule],
  controllers: [
    IntegrationArticlesController,
    IntegrationCategoriesController,
    IntegrationTagsController,
    IntegrationMediaController,
  ],
  providers: [
    ApiKeyOrJwtAuthGuard,
    IntegrationArticlesService,
    IntegrationCategoriesService,
    IntegrationTagsService,
    IntegrationWebhookService,
  ],
})
export class IntegrationModule {}

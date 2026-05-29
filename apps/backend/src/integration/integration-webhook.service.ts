import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type PublishedArticlePayload = {
  id: string;
  slug: string;
  title: string;
  url: string;
  publishedAt: string;
  authorId: string | null;
};

@Injectable()
export class IntegrationWebhookService {
  private readonly logger = new Logger(IntegrationWebhookService.name);

  constructor(private configService: ConfigService) {}

  async notifyArticlePublished(article: PublishedArticlePayload): Promise<void> {
    const url = this.configService.get<string>('OPERATOR_WEBHOOK_URL');
    const secret = this.configService.get<string>('ACOUSTIC_WEBHOOK_SECRET');
    if (!url) return;

    try {
      await axios.post(
        url,
        {
          event: 'article.published',
          article,
        },
        {
          headers: secret ? { 'X-Webhook-Secret': secret } : {},
          timeout: 10000,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Webhook yuborilmadi: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}

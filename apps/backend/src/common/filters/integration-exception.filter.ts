import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class IntegrationExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body =
        typeof raw === 'object' && raw !== null
          ? (raw as Record<string, unknown>)
          : { message: String(raw) };

      const errorName = this.errorName(status, body);
      const message =
        (typeof body.message === 'string' && body.message) ||
        (Array.isArray(body.message) && body.message.join('; ')) ||
        exception.message;

      const fields =
        typeof body.fields === 'object' && body.fields !== null
          ? (body.fields as Record<string, string>)
          : this.fieldsFromMessage(message);

      return response.status(status).json({
        error: errorName,
        message,
        ...(Object.keys(fields).length > 0 ? { fields } : {}),
        ...(typeof body.suggested_slug === 'string'
          ? { suggested_slug: body.suggested_slug }
          : {}),
      });
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Internal',
      message: 'Ichki server xatosi',
    });
  }

  private errorName(status: number, body: Record<string, unknown>): string {
    if (typeof body.error === 'string') return body.error;
    switch (status) {
      case 400:
        return 'ValidationError';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'NotFound';
      case 409:
        return 'Conflict';
      default:
        return status >= 500 ? 'Internal' : 'Error';
    }
  }

  private fieldsFromMessage(message: string): Record<string, string> {
    const fields: Record<string, string> = {};
    if (!message.includes(':')) return fields;
    for (const part of message.split(';')) {
      const idx = part.indexOf(':');
      if (idx > 0) {
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (key && val) fields[key] = val;
      }
    }
    return fields;
  }
}

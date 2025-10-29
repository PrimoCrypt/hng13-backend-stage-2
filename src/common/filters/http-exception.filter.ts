import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;

      // If developer provided a custom object, use it directly
      if (res && typeof res === 'object' && (res.error || res.details)) {
        response.status(status).json(res);
        return;
      }

      // Map common statuses to required shapes
      switch (status) {
        case HttpStatus.NOT_FOUND:
          response.status(status).json({ error: 'Country not found' });
          return;
        case HttpStatus.BAD_REQUEST:
          response.status(status).json({ error: 'Validation failed' });
          return;
        case HttpStatus.SERVICE_UNAVAILABLE:
          response.status(status).json({ error: 'External data source unavailable' });
          return;
        default:
          response.status(status).json({ error: 'Internal server error' });
          return;
      }
    }

    // Unknown errors
    response.status(500).json({ error: 'Internal server error' });
  }
}



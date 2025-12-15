import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = HttpStatus.TOO_MANY_REQUESTS;
    const message = exception.message || 'Too many requests. Please try again later.';

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Too Many Requests',
      detail: 'You have exceeded the rate limit. Please wait before making another request.',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}


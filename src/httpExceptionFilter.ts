/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

export interface HttpExceptionResponse {
  statusCode: number;
  message: string;
  error: string;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception
    ) {
      const errorCode = (exception as any).code;
      if (errorCode === 'EBADCSRFTOKEN') {
        return response.status(HttpStatus.FORBIDDEN).json({
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Invalid CSRF token',
          timestamp: new Date().toISOString(),
          path: httpAdapter.getRequestUrl(ctx.getRequest()),
        });
      }
    }

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    console.log('exception ==> ', exception);

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : String(exception);

    const responseBody = {
      success: false,
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message:
        (exceptionResponse as HttpExceptionResponse).error ||
        (exceptionResponse as HttpExceptionResponse).message ||
        exceptionResponse ||
        'Something went wrong',
      errorResponse: exceptionResponse as HttpExceptionResponse,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

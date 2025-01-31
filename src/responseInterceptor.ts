import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface Response<T> {
  message: string;
  success: boolean;
  result: any;
  timeStamp: Date;
  statusCode: number;
  error: null;
  path?: string;
}

@Injectable()
export class TransformationInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<Response<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    const path = context.switchToHttp().getRequest().url;

    return next.handle().pipe(
      map((data) => {
        if (!data) {
          return {
            message: 'No data returned',
            success: false,
            result: null,
            timeStamp: new Date(),
            statusCode: 500,
            error: null,
            path,
          };
        }

        return {
          message: data.message,
          success: data.success,
          result: data.result,
          timeStamp: new Date(),
          statusCode,
          path,
          error: null,
        };
      }),
    );
  }
}

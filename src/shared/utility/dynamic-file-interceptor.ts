/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { FileInterceptor } from '@nestjs/platform-express';
import { Injectable, Type, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamicFileInterceptor {
  static create(configService: ConfigService): Type<NestInterceptor> {
    const filePath =
      configService.get<string>('FILE_STORAGE_PATH') || '../uploads/';

    return FileInterceptor('productImage', {
      dest: filePath,
      limits: {
        fileSize: 3145728,
      },
    }) as Type<NestInterceptor>;
  }
}

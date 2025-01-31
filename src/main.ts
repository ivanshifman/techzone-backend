import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {rawBody: true});
  const configService = app.get(ConfigService);
  const appPrefix = configService.get<string>('API_PREFIX') || '/api/v1';
  const port = configService.get<number>('PORT') || 3000;

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: true
  }));
  app.setGlobalPrefix(appPrefix);
  app.use(`${appPrefix}/orders/webhook`, raw({ type: '*/*' }));
  
  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
bootstrap();

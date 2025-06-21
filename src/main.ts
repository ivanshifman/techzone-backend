/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const appPrefix = configService.get<string>('API_PREFIX') || '/api/v1';
  const port = configService.get<number>('PORT') || 8080;
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
  app.enableCors({ origin: corsOrigin, credentials: true });

  app.use(cookieParser());
  app.use(helmet());

  // const ROOT_IGNORED_PATHS = [
  //   `${configService.get<string>('API_PREFIX')}/orders/webhook`,
  // ];
  // const csrfMiddleware = csurf({
  //   cookie: {
  //     key: '_csrf',
  //     httpOnly: false,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //   },
  // });
  // app.use((req: Request, res: Response, next: NextFunction) => {
  //   if (ROOT_IGNORED_PATHS.includes(req.path)) {
  //     return next();
  //   }
  //   return csrfMiddleware(req, res, next);
  // });

  // app.use((req: Request, res, next) => {
  //   console.log('Cookies:', req.cookies); // Verifica si `_csrf` está presente
  //   console.log('Headers:', req.headers);
  //   next();
  // });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true,
    }),
  );
  app.setGlobalPrefix(appPrefix);
  app.use(`${appPrefix}/orders/webhook`, raw({ type: '*/*' }));

  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
bootstrap();

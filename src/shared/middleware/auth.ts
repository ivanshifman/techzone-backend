/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { NextFunction } from 'express';
import { AuthService } from '../utility/token-generator';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userDb: UserRepository,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request | any, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.auth_token;
      if (!token) {
        throw new UnauthorizedException('Missing auth token');
      }

      let decodeData: any;
      try {
        decodeData = this.authService.decodeAuthToken(token);
      } catch {
        throw new UnauthorizedException('Invalid auth token');
      }

      if (!decodeData || !decodeData.id) {
        throw new UnauthorizedException('Invalid token data');
      }

      const user = await this.userDb.findById(decodeData.id);
      if (!user) {
        throw new UnauthorizedException('Unauthorized');
      }

      const { password, ...safeUser } = user;
      req.user = safeUser;
      next();
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnauthorizedException('Unauthorized');
    }
  }
}

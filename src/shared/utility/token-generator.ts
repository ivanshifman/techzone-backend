import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  generateAuthToken(id: string, type: string): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('Token generation failed');
    }
    return jwt.sign({ id, type }, secret, { expiresIn: '5m' });
  }

  decodeAuthToken(token: string): any {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('Token verification failed');
    }

    try {
      return jwt.verify(token, secret);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

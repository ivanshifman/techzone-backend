import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

@Injectable()
export class ValidateMongoIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const idsToValidate = ['id', 'productId', 'skuId', 'licenseKeyId'];

    for (const param of idsToValidate) {
      if (req.params[param] && !Types.ObjectId.isValid(req.params[param])) {
        throw new BadRequestException(
          'Invalid ID format in request parameters.',
        );
      }
    }

    next();
  }
}

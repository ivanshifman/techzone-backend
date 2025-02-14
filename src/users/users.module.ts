import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UserSchema } from 'src/shared/schema/users';
import { AuthService } from 'src/shared/utility/token-generator';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { ValidateMongoIdMiddleware } from 'src/shared/middleware/validate.id';
import { AuthenticatedMiddleware } from 'src/shared/middleware/authenticated';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/users', method: RequestMethod.GET });
    consumer
      .apply(ValidateMongoIdMiddleware)
      .forRoutes(
        { path: 'users/update-name-password/:id', method: RequestMethod.PATCH },
        { path: 'users/:id', method: RequestMethod.DELETE },
      );
    consumer
      .apply(AuthenticatedMiddleware)
      .forRoutes({ path: 'users', method: RequestMethod.POST });
  }
}

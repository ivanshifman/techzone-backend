import {
  InternalServerErrorException,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { OrdersRepository } from 'src/shared/repositories/order.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Products, ProductSchema } from 'src/shared/schema/products';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UserSchema } from 'src/shared/schema/users';
import { License, LicenseSchema } from 'src/shared/schema/license';
import { Orders, OrderSchema } from 'src/shared/schema/orders';
import { StripeModule } from '@golevelup/nestjs-stripe';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { AuthService } from 'src/shared/utility/token-generator';
import { ValidateMongoIdMiddleware } from 'src/shared/middleware/validate.id';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Products.name,
        schema: ProductSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: License.name,
        schema: LicenseSchema,
      },
      {
        name: Orders.name,
        schema: OrderSchema,
      },
    ]),
    StripeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const apiKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!apiKey) {
          throw new InternalServerErrorException(
            'An unexpected error occurred during Stripe configuration.',
          );
        }
        return {
          apiKey,
          apiVersion: '2024-12-18.acacia',
        };
      },
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    UserRepository,
    ProductRepository,
    OrdersRepository,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({
        path: '/orders/webhook',
        method: RequestMethod.POST,
      })
      .forRoutes(OrdersController);
    consumer
      .apply(ValidateMongoIdMiddleware)
      .forRoutes({ path: 'orders/:id', method: RequestMethod.GET });
  }
}

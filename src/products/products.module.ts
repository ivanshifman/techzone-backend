import {
  InternalServerErrorException,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Products, ProductSchema } from 'src/shared/schema/products';
import { Users, UserSchema } from 'src/shared/schema/users';
import { License, LicenseSchema } from 'src/shared/schema/license';
import { Orders, OrderSchema } from 'src/shared/schema/orders';
import { StripeModule } from '@golevelup/nestjs-stripe';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { OrdersRepository } from 'src/shared/repositories/order.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
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
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    UserRepository,
    OrdersRepository,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: 'products',
          method: RequestMethod.GET,
        },
        {
          path: 'products/:id',
          method: RequestMethod.GET,
        },
      )
      .forRoutes(ProductsController);
    consumer.apply(ValidateMongoIdMiddleware).forRoutes(
      { path: 'products/:id', method: RequestMethod.GET },
      { path: 'products/:id', method: RequestMethod.PATCH },
      { path: 'products/:id', method: RequestMethod.DELETE },
      { path: 'products/:id/image', method: RequestMethod.POST },
      { path: 'products/:productId/skus', method: RequestMethod.POST },
      {
        path: 'products/:productId/skus/:skuId/licenses',
        method: RequestMethod.POST,
      },
      {
        path: 'products/:productId/skus/:skuId/licenses',
        method: RequestMethod.GET,
      },
      { path: 'products/:productId/skus/:skuId', method: RequestMethod.PUT },
      { path: 'products/:productId/skus/:skuId', method: RequestMethod.DELETE },
      {
        path: 'products/:productId/skus/:skuId/licenses/:licenseKeyId',
        method: RequestMethod.PUT,
      },
      { path: 'products/licenses/:licenseKeyId', method: RequestMethod.DELETE },
      { path: 'products/:productId/reviews', method: RequestMethod.POST },
      {
        path: 'products/:productId/reviews/:reviewId',
        method: RequestMethod.DELETE,
      },
    );
  }
}

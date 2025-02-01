import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { OrdersRepository } from 'src/shared/repositories/order.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { UserType } from 'src/shared/schema/users';
import { orderStatus, paymentStatus } from 'src/shared/schema/orders';
import { CheckoutDtoArr } from './dto/checkout.dto';
import { mailTemplates } from 'src/shared/utility/mail-templates';
import { sendMail } from 'src/shared/utility/mail-handler';

@Injectable()
export class OrdersService {
  constructor(
    private readonly productDb: ProductRepository,
    private readonly userDb: UserRepository,
    private readonly orderDb: OrdersRepository,
    private readonly configService: ConfigService,
    @InjectStripeClient() private readonly stripeClient: Stripe,
  ) {}
  async create(createOrderDto: Record<string, any>) {
    try {
      const orderExists = await this.orderDb.findOne({
        checkoutSessionId: createOrderDto.checkoutSessionId,
      });
      if (orderExists) {
        throw new ConflictException('Order already exists');
      }

      const result = await this.orderDb.create(createOrderDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    status: string,
    user: Record<string, any>,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      if (!user?._id) {
        throw new BadRequestException('Invalid user');
      }

      const userDetails = await this.userDb.findOne({
        _id: user._id.toString(),
      });
      if (!userDetails) {
        throw new BadRequestException('User not found');
      }

      const query: Record<string, any> = {};
      if (userDetails.type === UserType.CUSTOMER) {
        query.userId = user._id.toString();
      }
      if (status) {
        query.status = status;
      }

      const orders = await this.orderDb.find(query);
      if (orders.length === 0) {
        throw new NotFoundException('No orders found');
      }

      return {
        message: 'Orders fetched successfully',
        success: true,
        result: orders,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const result = await this.orderDb.findOne({ _id: id });
      if (!result) {
        throw new BadRequestException('Order not found');
      }
      return {
        message: 'Order fetched successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkout(
    body: CheckoutDtoArr,
    user: Record<string, any>,
  ): Promise<{ message: string; success: boolean; result: any }> {
    try {
      const cartItems = body.checkoutDetails;
      const lineItems: {
        price: string;
        quantity: number;
        adjustable_quantity: {
          enabled: boolean;
          maximum: number;
          minimum: number;
        };
      }[] = [];

      for (const item of cartItems) {
        const product = await this.productDb.findOne({
          'skuDetails._id': item.skuId,
        });
        if (!product) {
          throw new NotFoundException(
            `Product with SKU ${item.skuId} not found`,
          );
        }
        const sku = product.skuDetails.find(
          (s) => s._id.toString() === item.skuId,
        );
        if (!sku) {
          throw new NotFoundException(`SKU ${item.skuId} does not exist`);
        }

        if (sku.stock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for product ${item.skuId}`,
          );
        }

        const availableItems = await this.productDb.findLicense({
          productSku: item.skuId,
          isSold: false,
        });

        if (!availableItems) {
          throw new BadRequestException(
            `No licenses available for product ${item.skuId}`,
          );
        }

        if (!item.skuPriceId) {
          throw new BadRequestException(
            `Price not found for product ${item.skuId}`,
          );
        }

        lineItems.push({
          price: item.skuPriceId,
          quantity: item.quantity,
          adjustable_quantity: {
            enabled: true,
            maximum: sku.stock,
            minimum: sku.stock > 1 ? 1 : 0,
          },
        });
      }

      if (lineItems.length === 0) {
        throw new BadRequestException('No products available for checkout');
      }

      let session: Stripe.Checkout.Session;
      try {
        session = await this.stripeClient.checkout.sessions.create({
          line_items: lineItems,
          metadata: { userId: user._id.toString() },
          mode: 'payment',
          billing_address_collection: 'required',
          phone_number_collection: { enabled: true },
          customer_email: user.email,
          success_url: this.configService.get<string>('STRIPE_SUCCESS_URL'),
          cancel_url: this.configService.get<string>('STRIPE_CANCEL_URL'),
        });
      } catch (error) {
        if (
          error instanceof Error &&
          'type' in error &&
          error.type === 'StripeInvalidRequestError' &&
          'code' in error &&
          error.code === 'resource_missing' &&
          'param' in error
        ) {
          throw new BadRequestException(
            'The price ID provided is invalid or missing.',
          );
        }
        throw error;
      }

      return {
        message: 'Payment checkout session successfully created',
        success: true,
        result: session.url,
      };
    } catch (error) {
      throw error;
    }
  }

  async webhook(rawBody: Buffer, sig: string) {
    try {
      let event: any;
      try {
        const stripeSecret =
          this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
        event = this.stripeClient.webhooks.constructEvent(
          rawBody,
          sig,
          stripeSecret,
        );
      } catch (err) {
        if (err instanceof Error) {
          throw new BadRequestException('Webhook Error: ' + err.message);
        }
        throw new BadRequestException('Unknown Webhook Error');
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderData = await this.createOrderObject(session);
        const order = await this.create(orderData);
        if (session.payment_status === paymentStatus.paid) {
          if (order.orderStatus !== orderStatus.completed) {
            await Promise.all(
              order.orderedItems.map(async (item) => {
                item.licenses = await this.getLicense(orderData.orderId, item);
              }),
            );
          }

          await this.fullfillOrder(session.id, {
            orderStatus: orderStatus.completed,
            isOrderDelivered: true,
            ...orderData,
          });

          const webhookTemplate = mailTemplates['webhook']?.(
            orderData.customerEmail,
            orderData.orderId,
          );

          if (!webhookTemplate) {
            throw new InternalServerErrorException(
              'An unexpected error occurred. Please try again later.',
            );
          }

          await sendMail(
            orderData.customerEmail,
            webhookTemplate,
            'Order success - Techzone',
          );
        }
      } else {
        console.log('Unhandled event type', event.type);
      }
    } catch (error) {
      throw error;
    }
  }

  async createOrderObject(session: Stripe.Checkout.Session) {
    try {
      const lineItems = await this.stripeClient.checkout.sessions.listLineItems(
        session.id,
      );
      if (!lineItems) {
        throw new InternalServerErrorException('No line items found');
      }
      const orderData = {
        orderId: Math.floor(new Date().valueOf() * Math.random()) + '',
        userId: session.metadata?.userId?.toString(),
        customerAddress: session.customer_details?.address,
        customerEmail: session.customer_email ?? '',
        customerPhoneNumber: session.customer_details?.phone ?? '',
        paymentInfo: {
          paymentMethod: session.payment_method_types[0],
          paymentIntentId: session.payment_intent,
          paymentDate: new Date(),
          paymentAmount: (session.amount_total ?? 0) / 100,
          paymentStatus: session.payment_status,
        },
        orderDate: new Date(),
        checkoutSessionId: session.id,
        orderedItems: lineItems.data.map((item) => {
          if (!item.price) {
            throw new InternalServerErrorException(
              'Price data is missing for an item',
            );
          }
          item.price.metadata.quantity = item.quantity + '';
          return item.price.metadata;
        }),
      };
      return orderData;
    } catch (error) {
      throw error;
    }
  }

  async getLicense(orderId: string, item: Record<string, any>) {
    try {
      const product = await this.productDb.findOne({
        _id: item.productId,
      });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const skuDetails = product.skuDetails.find(
        (sku) => sku.skuCode === item.skuCode,
      );
      if (!skuDetails) {
        throw new NotFoundException('Sku does not exist');
      }

      const licenses = await this.productDb.findLicense(
        {
          productSku: skuDetails._id,
          isSold: false,
        },
        item.quantity,
      );

      const licenseIds = licenses.map((license) => license._id);

      const newStock = skuDetails.stock - item.quantity;

      await this.productDb.findOneAndUpdate(
        { 'skuDetails._id': skuDetails._id },
        {
          $set: {
            'skuDetails.$.stock': newStock,
          },
        },
      );

      if (newStock === 0) {
        await this.productDb.updateLicenseMany(
          {
            _id: { $in: licenseIds },
          },
          {
            $set: {
              isSold: true,
              orderId,
            },
          },
        );
      } else {
        await this.productDb.updateLicenseMany(
          {
            _id: { $in: licenseIds },
          },
          {
            $set: {
              orderId,
            },
          },
        );
      }
      return licenses.map((license) => license.licenseKey);
    } catch (error) {
      throw error;
    }
  }

  async fullfillOrder(
    checkoutSessionId: string,
    updateOrderDto: Record<string, any>,
  ) {
    try {
      return await this.orderDb.findOneAndUpdate(
        { checkoutSessionId },
        updateOrderDto,
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }
}

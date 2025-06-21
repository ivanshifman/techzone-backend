/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Headers,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Roles } from 'src/shared/middleware/role.decorator';
import { UserType } from 'src/shared/schema/users';
import { CheckoutDtoArr } from './dto/checkout.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('status') status: string, @Req() req: any) {
    return await this.ordersService.findAll(status, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ordersService.findOne(id);
  }

  @Roles(UserType.CUSTOMER)
  @Post('/checkout')
  async checkout(@Body() body: CheckoutDtoArr, @Req() req: any) {
    return await this.ordersService.checkout(body, req.user);
  }

  @Post('/webhook')
  async webhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') sig: string,
  ) {
    return await this.ordersService.webhook(rawBody, sig);
  }
}

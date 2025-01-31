import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Orders } from '../schema/orders';


@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Orders.name) private readonly orderModel: Model<Orders>,
  ) {}

  async find(query: any) {
    return await this.orderModel.find(query).lean();
  }

  async findOne(query: any) {
    return await this.orderModel.findOne(query).lean();
  }

  async create(order: any) {
    return await this.orderModel.create(order);
  }

  async findOneAndUpdate(query: any, update: any, options: any) {
    return await this.orderModel.findOneAndUpdate(query, update, options);
  }
}

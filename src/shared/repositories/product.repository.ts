import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Products } from '../schema/products';
import { PaginateModel } from 'mongoose';
import { CreateProductDto } from 'src/products/dto/create-product.dto';




@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Products.name) private readonly productModel: PaginateModel<Products>,
  ) {}

  async create(product: CreateProductDto) {
    return await this.productModel.create(product);
  }

  async findOne(query: any) {
    return await this.productModel.findOne(query).lean();
  }

  async findOneAndUpdate(query: any, update: any) {
    return await this.productModel.findOneAndUpdate(query, update, {
      new: true,
    });
  }

  async findOneAndDelete(query: any) {
    return await this.productModel.findOneAndDelete(query);
  }

  async findRelatedProducts(query: Record<string, any>) {
    const products = await this.productModel.aggregate([
      {
        $match: query,
      },
      {
        $sample: { size: 4 },
      },
    ]);
    return products;
  }

  async findProductWithGroupBy() {
    return await this.productModel.aggregate([
      {
        $facet: {
          latestProducts: [{ $sort: { createdAt: -1 } }, { $limit: 4 }],
          topRatedProducts: [{ $sort: { avgRating: -1 } }, { $limit: 8 }],
        },
      },
    ]);
  }

  async find(query: Record<string, any>, options: any) {
    if (query.search) {
        query.productName = new RegExp(query.search, 'i');
        delete query.search;
      }
  
      const result = await this.productModel.paginate(query, options);
      return {
        totalProductCount: result.totalDocs,
        products: result.docs,
      };
  }
}

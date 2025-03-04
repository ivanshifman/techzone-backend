import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Products } from '../schema/products';
import { License } from '../schema/license';
import { Model, PaginateModel } from 'mongoose';
import { CreateProductDto } from 'src/products/dto/create-product.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Products.name)
    private readonly productModel: PaginateModel<Products>,
    @InjectModel(License.name)
    private readonly licenseModel: Model<License>,
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
    ]).exec();
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
    ]).exec();
  }

  async find(query: Record<string, any>, options: any) {
    if (query.search) {
      query.productName = new RegExp(query.search, 'i');
      delete query.search;
    }

    if (query.avgRating) {
      const sortOrder =
        query.avgRating === 'asc' ? 1 : query.avgRating === 'desc' ? -1 : null;
      if (sortOrder === null) {
        throw new BadRequestException(
          'Invalid avgRating value. It should be "asc" or "desc".',
        );
      }
      options.sort['avgRating'] = sortOrder;
      delete query.avgRating;
    }

    if (query.createdAt) {
      const sortOrder =
        query.createdAt === 'asc' ? 1 : query.createdAt === 'desc' ? -1 : null;
      if (sortOrder === null) {
        throw new BadRequestException(
          'Invalid createdAt value. It should be "asc" or "desc".',
        );
      }
      options.sort['createdAt'] = sortOrder;
      delete query.createdAt;
    }

    const result = await this.productModel.paginate(query, options);
    return {
      totalProductCount: result.totalDocs,
      products: result.docs,
    };
  }

  async createLicense(productId: string, skuId: string, licenseKey: string) {
    const newLicense = new this.licenseModel({
      product: productId,
      productSku: skuId,
      licenseKey,
    });

    return await newLicense.save();
  }

  async removeLicense(query: any) {
    return await this.licenseModel.findOneAndDelete(query);
  }

  async findLicense(query: any, limit?: number) {
    if (limit && limit > 0) {
      const license = await this.licenseModel.find(query).limit(limit).lean();
      return license;
    }
    const license = await this.licenseModel.find(query).lean();
    return license;
  }

  async updateLicense(query: any, update: any) {
    return await this.licenseModel.findOneAndUpdate(query, update, {
      new: true,
    });
  }

  async updateLicenseMany(query: any, data: any) {
    return await this.licenseModel.updateMany(query, data);
  }

  async deleteSku(id: string, skuId: string) {
    return await this.productModel.updateOne(
      { _id: id },
      {
        $pull: {
          skuDetails: { _id: skuId },
        },
      },
    );
  }

  async deleteAllLicences(productId: string, skuId: string) {
    if (productId)
      return await this.licenseModel.deleteMany({ product: productId });
    return await this.licenseModel.deleteMany({ productSku: skuId });
  }
}

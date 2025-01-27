import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { ConfigService } from '@nestjs/config';
import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import Stripe from 'stripe';
import { Products } from 'src/shared/schema/products';
import { GetProductQueryDto } from './dto/get-product-quey-dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productDb: ProductRepository,
    private readonly configService: ConfigService,
    @InjectStripeClient() private readonly stripeClient: Stripe,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<{
    message: string;
    result: Products;
    success: boolean;
  }> {
    try {
      if (!createProductDto.stripeProductId) {
        const createdProductInStripe = await this.stripeClient.products.create({
          name: createProductDto.productName,
          description: createProductDto.description,
        });
        createProductDto.stripeProductId = createdProductInStripe.id;
      }

      const existingProduct = await this.productDb.findOne({
        productName: createProductDto.productName,
      });
      if (existingProduct) {
        throw new ConflictException('Product already exists');
      }

      const createdProduct = await this.productDb.create(createProductDto);

      return {
        message: 'Product created successfully',
        result: createdProduct,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  // async findAllProducts(query: GetProductQueryDto):Promise<{
  //   message: string;
  //   result: any;
  //   success: boolean;
  // }> {
  //   try {
  //     let callForHomePage = false;
  //     if (query.homePage) {
  //       callForHomePage = true;
  //     }
  //     delete query.homePage;

  //     const { criteria, options, links } = queryToMongo(query);
  //     if (callForHomePage) {
  //       const products = await this.productDb.findProductWithGroupBy();
  //       return {
  //         message:
  //           products.length > 0
  //             ? 'Products fetched successfully'
  //             : 'No products found',
  //         result: products,
  //         success: true,
  //       };
  //     }
  //     const { totalProductCount, products } = await this.productDb.find(
  //       criteria,
  //       options,
  //     );
  //     return {
  //       message:
  //         products.length > 0
  //           ? 'Products fetched successfully'
  //           : 'No products found',
  //       result: {
  //         metadata: {
  //           skip: options.skip || 0,
  //           limit: options.limit || 10,
  //           total: totalProductCount,
  //           pages: options.limit
  //             ? Math.ceil(totalProductCount / options.limit)
  //             : 1,
  //           links: links('/', totalProductCount),
  //         },
  //         products,
  //       },
  //       success: true,
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  async findAllProducts(query: GetProductQueryDto): Promise<{
    message: string;
    result: any;
    success: boolean;
  }> {
    try {
      let callForHomePage = false;
      if (query.homePage) {
        callForHomePage = true;
      }
      delete query.homePage;

      const options = {
        page: query.page || 1,
        limit: query.limit || 12,
        sort: query.sort || { _id: 1 },
      };

      if (callForHomePage) {
        const products = await this.productDb.findProductWithGroupBy();
        if (products.length === 0) {
          throw new NotFoundException('No products found');
        }
        return {
          message: 'Products fetched successfully',
          result: products,
          success: true,
        };
      }

      const { totalProductCount, products } = await this.productDb.find(
        query,
        options,
      );

      if (products.length === 0) {
        throw new NotFoundException('No products found');
      }

      return {
        message: 'Products fetched successfully',
        result: {
          metadata: {
            skip: (options.page - 1) * options.limit,
            limit: options.limit,
            total: totalProductCount,
            pages: Math.ceil(totalProductCount / options.limit),
          },
          products,
        },
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOneProduct(id: string): Promise<{
    message: string;
    result: { product: Products; relatedProducts: Products[] };
    success: boolean;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: id });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }
      const relatedProducts: Products[] =
        await this.productDb.findRelatedProducts({
          category: product.category,
          _id: { $ne: id },
        });

      return {
        message: 'Product found successfully',
        result: { product, relatedProducts },
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: CreateProductDto,
  ): Promise<{
    message: string;
    result: Products;
    success: boolean;
  }> {
    try {
      const productExist = await this.productDb.findOne({ _id: id });
      if (!productExist) {
        throw new NotFoundException('Product does not exist');
      }

      const updatedProduct = await this.productDb.findOneAndUpdateOne(
        { _id: id },
        updateProductDto,
      );
      if (!updatedProduct) {
        throw new NotFoundException('Failed to update product');
      }

      if (!productExist.stripeProductId) {
        await this.stripeClient.products.update(productExist.stripeProductId, {
          name: updateProductDto.productName,
          description: updateProductDto.description,
        });
      }

      return {
        message: 'Product updated successfully',
        result: updatedProduct,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeProduct(id: string): Promise<{
    message: string;
    success: boolean;
    result: null;
  }> {
    try {
      const productExist = await this.productDb.findOne({ _id: id });
      if (!productExist) {
        throw new NotFoundException('Product does not exist');
      }

      await Promise.all([
        this.productDb.findOneAndDelete({ _id: id }),
        this.stripeClient.products
          .del(productExist.stripeProductId)
          .catch((error) => {
            console.warn(
              `Failed to delete the product in external service. Product ID: ${productExist._id}. Reason: ${error.message}`,
            );
          }),
      ]);

      return {
        message: 'Product deleted successfully',
        success: true,
        result: null,
      };
    } catch (error) {
      throw error;
    }
  }
}

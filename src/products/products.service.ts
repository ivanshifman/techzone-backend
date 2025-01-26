import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { ConfigService } from '@nestjs/config';
import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import Stripe from 'stripe';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productDb: ProductRepository,
    private readonly configService: ConfigService,
    @InjectStripeClient() private readonly stripeClient: Stripe,
  ) {}

  async createProduct(createProductDto: CreateProductDto) {
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

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  async updateProduct(id: string, updateProductDto: CreateProductDto) {
    try {
      const productExist = await this.productDb.findOne({ _id: id });
      if (!productExist) {
        throw new NotFoundException('Product does not exist');
      }

      const updatedProduct = await this.productDb.findOneAndUpdateOne(
        { _id: id },
        updateProductDto,
      );

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

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}

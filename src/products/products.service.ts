import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import * as cloudinary from 'cloudinary';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { OrdersRepository } from 'src/shared/repositories/order.repository';
import { ConfigService } from '@nestjs/config';
import { Products } from 'src/shared/schema/products';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductQueryDto } from './dto/get-product-quey-dto';
import { ProductSkuDto, ProductSkuDtoArr } from './dto/product-sku-dto';
import { AddProductReviewDto } from './dto/add-rating.dto';
import { unlinkSync } from 'fs';


@Injectable()
export class ProductsService {
  constructor(
    private readonly productDb: ProductRepository,
    private readonly orderDb: OrdersRepository,
    private readonly configService: ConfigService,
    @InjectStripeClient() private readonly stripeClient: Stripe,
  ) {
    cloudinary.v2.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

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

      const updatedProduct = await this.productDb.findOneAndUpdate(
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

  async uploadProductImage(
    id: string,
    file: any,
  ): Promise<{
    message: string;
    result: string;
    success: boolean;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: id });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      if (product.imageDetails?.public_id) {
        await cloudinary.v2.uploader.destroy(product.imageDetails.public_id, {
          invalidate: true,
        });
      }

      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const resOfCloudinary = await cloudinary.v2.uploader.upload(file.path, {
        folder: this.configService.get<string>('CLOUDINARY_FOLDER_PATH'),
        public_id: `product_${id}${Date.now()}`,
        transformation: [
          {
            width: this.configService
              .get('CLOUDINARY_BIGSIZE')
              .toString()
              .split('X')[0],
            height: this.configService
              .get('CLOUDINARY_BIGSIZE')
              .toString()
              .split('X')[1],
            crop: 'fill',
          },
          { quality: 'auto' },
        ],
      });

      unlinkSync(file.path);
      await this.productDb.findOneAndUpdate(
        { _id: id },
        { imageDetails: resOfCloudinary, image: resOfCloudinary.secure_url },
      );

      await this.stripeClient.products.update(product.stripeProductId, {
        images: [resOfCloudinary.secure_url],
      });

      return {
        message: 'Product image uploaded successfully',
        result: resOfCloudinary.secure_url,
        success: true,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProductSku(
    productId: string,
    data: ProductSkuDtoArr,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const generateSkuCode = () =>
        Math.random().toString(36).substring(2, 8) + '-' + Date.now();
      for (let i = 0; i < data.skuDetails.length; i++) {
        data.skuDetails[i].skuCode = generateSkuCode();
        if (!data.skuDetails[i].stripePriceId) {
          const stripPriceDetails = await this.stripeClient.prices.create({
            unit_amount: Math.round(data.skuDetails[i].price * 100),
            currency: 'usd',
            product: product.stripeProductId,
            metadata: {
              skuCode: data.skuDetails[i].skuCode ?? '',
              lifetime: data.skuDetails[i].lifetime + '',
              productId: productId,
              price: data.skuDetails[i].price,
              stock: data.skuDetails[i].stock,
              productName: product.productName,
              productImage:
                product.image ||
                'https://static.vecteezy.com/system/resources/thumbnails/016/808/173/small_2x/camera-not-allowed-no-photography-image-not-available-concept-icon-in-line-style-design-isolated-on-white-background-editable-stroke-vector.jpg',
            },
          });
          if (stripPriceDetails && stripPriceDetails.id) {
            data.skuDetails[i].stripePriceId = stripPriceDetails.id;
          } else {
            throw new InternalServerErrorException(
              'Failed to create stripe price: missing ID',
            );
          }
        }
      }

      const updatedProduct = await this.productDb.findOneAndUpdate(
        { _id: productId },
        { $push: { skuDetails: data.skuDetails } },
      );

      return {
        message: 'Product sku updated successfully',
        success: true,
        result: updatedProduct,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProductSkuById(
    productId: string,
    skuId: string,
    data: ProductSkuDto,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new NotFoundException('Sku does not exist');
      }

      if (data.price !== sku.price) {
        const priceDetails = await this.stripeClient.prices.create({
          unit_amount: Math.round(data.price * 100),
          currency: 'usd',
          product: product.stripeProductId,
          metadata: {
            skuCode: sku.skuCode ?? '',
            lifetime: data.lifetime + '',
            productId: productId,
            price: data.price,
            stock: data.stock,
            productName: product.productName,
            productImage:
              product.image ||
              'https://static.vecteezy.com/system/resources/thumbnails/016/808/173/small_2x/camera-not-allowed-no-photography-image-not-available-concept-icon-in-line-style-design-isolated-on-white-background-editable-stroke-vector.jpg',
          },
        });

        data.stripePriceId = priceDetails.id;
      }

      const dataForUpdate = Object.keys(data).reduce((acc, key) => {
        acc[`skuDetails.$.${key}`] = data[key];
        return acc;
      }, {});

      const result = await this.productDb.findOneAndUpdate(
        { _id: productId, 'skuDetails._id': skuId },
        { $set: dataForUpdate },
      );

      return {
        message: 'Product sku updated successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async addProductSkuLicense(
    productId: string,
    skuId: string,
    licenseKey: string,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new NotFoundException('Sku does not exist');
      }

      if (!licenseKey) {
        throw new BadRequestException('License key is required');
      }

      const result = await this.productDb.createLicense(
        productId,
        skuId,
        licenseKey,
      );

      return {
        message: 'License key added successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeProductSkuLicense(id: string): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const result = await this.productDb.removeLicense({ _id: id });
      if (!result) {
        throw new NotFoundException('License key does not exist');
      }
      return {
        message: 'License key removed successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async getProductSkuLicenses(
    productId: string,
    skuId: string,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new NotFoundException('Sku does not exist');
      }

      const result = await this.productDb.findLicense({
        product: productId,
        productSku: skuId,
      });

      return {
        message: 'Licenses fetched successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProductSkuLicense(
    productId: string,
    skuId: string,
    licenseKeyId: string,
    licenseKey: string,
  ): Promise<{
    message: string;
    success: boolean;
    result: any;
  }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const sku = product.skuDetails.find((sku) => sku._id == skuId);
      if (!sku) {
        throw new NotFoundException('Sku does not exist');
      }

      if (!licenseKey) {
        throw new BadRequestException('License key is required');
      }

      const license = await this.productDb.findLicense({ _id: licenseKeyId });
      if (!license) {
        throw new NotFoundException('License key does not exist');
      }

      const result = await this.productDb.updateLicense(
        { _id: licenseKeyId },
        { licenseKey: licenseKey },
      );

      return {
        message: 'License key updated successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async addProductReview(
    productId: string,
    reviewData: AddProductReviewDto,
    user: Record<string, any>,
  ): Promise<{ message: string; success: boolean; result: any }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      if (
        product.feedbackDetails.find(
          (value: { customerId: string }) =>
            value.customerId === user._id.toString(),
        )
      ) {
        throw new BadRequestException(
          'You have already gave the review for this product',
        );
      }

      const order = await this.orderDb.findOne({
        userId: user._id,
        'orderedItems.productId': productId,
      });

      if (!order) {
        throw new BadRequestException('You have not purchased this product');
      }

      const { rating, review } = reviewData;
      const ratings: any[] = [];
      product.feedbackDetails.forEach((comment: { rating: any }) =>
        ratings.push(comment.rating),
      );

      let avgRating = String(rating);
      if (ratings.length > 0) {
        avgRating = (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(
          2,
        );
      }

      const reviewDetails = {
        rating: rating,
        feedbackMsg: review,
        customerId: user._id,
        customerName: user.name,
      };

      const result = await this.productDb.findOneAndUpdate(
        { _id: productId },
        { $set: { avgRating }, $push: { feedbackDetails: reviewDetails } },
      );

      return {
        message: 'Product review added successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeProductReview(
    productId: string,
    reviewId: string,
  ): Promise<{ message: string; success: boolean; result: any }> {
    try {
      const product = await this.productDb.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException('Product does not exist');
      }

      const review = product.feedbackDetails.find(
        (review) => review._id == reviewId,
      );
      if (!review) {
        throw new NotFoundException('Review does not exist');
      }

      const ratings: any[] = [];
      product.feedbackDetails.forEach((comment) => {
        if (comment._id.toString() !== reviewId) {
          ratings.push(comment.rating);
        }
      });

      let avgRating = '0';
      if (ratings.length > 0) {
        avgRating = (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(
          2,
        );
      }

      const result = await this.productDb.findOneAndUpdate(
        { _id: productId },
        { $set: { avgRating }, $pull: { feedbackDetails: { _id: reviewId } } },
      );

      return {
        message: 'Product review removed successfully',
        success: true,
        result,
      };
    } catch (error) {
      throw error;
    }
  }
}

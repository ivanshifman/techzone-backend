import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
  UseInterceptors,
  UploadedFile,
  Put,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductQueryDto } from './dto/get-product-quey-dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product-dto';
import { ProductSkuDto, ProductSkuDtoArr } from './dto/product-sku-dto';
import { AddProductReviewDto } from './dto/add-rating.dto';
import { Roles } from 'src/shared/middleware/role.decorator';
import { UserType } from 'src/shared/schema/users';
import { ConfigService } from '@nestjs/config';
import { DynamicFileInterceptor } from 'src/shared/utility/dynamic-file-interceptor';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(201)
  @Roles(UserType.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.createProduct(createProductDto);
  }

  @Get()
  async findAll(@Query() query: GetProductQueryDto) {
    return await this.productsService.findAllProducts(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productsService.findOneProduct(id);
  }

  @Patch(':id')
  @Roles(UserType.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productsService.removeProduct(id);
  }

  @Post('/:id/image')
  @Roles(UserType.ADMIN)
  @UseInterceptors(
    (function () {
      const configService = new ConfigService();
      return DynamicFileInterceptor.create(configService);
    })(),
  )
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.productsService.uploadProductImage(id, file);
  }

  @Post('/:productId/skus')
  @Roles(UserType.ADMIN)
  async updateProductSku(
    @Param('productId') productId: string,
    @Body() updateProductDto: ProductSkuDtoArr,
  ) {
    return await this.productsService.updateProductSku(
      productId,
      updateProductDto,
    );
  }

  @Put('/:productId/skus/:skuId')
  @Roles(UserType.ADMIN)
  async updateProductSkuById(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body() updateProductDto: ProductSkuDto,
  ) {
    return await this.productsService.updateProductSkuById(
      productId,
      skuId,
      updateProductDto,
    );
  }

  @Delete('/:productId/skus/:skuId')
  @Roles(UserType.ADMIN)
  async deleteSkuById(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.productsService.deleteProductSkuById(productId, skuId);
  }

  @Post('/:productId/skus/:skuId/licenses')
  @Roles(UserType.ADMIN)
  async addProductSkuLicense(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.productsService.addProductSkuLicense(
      productId,
      skuId,
      licenseKey,
    );
  }

  @Delete('/licenses/:licenseKeyId')
  @Roles(UserType.ADMIN)
  async removeProductSkuLicense(@Param('licenseKeyId') licenseId: string) {
    return await this.productsService.removeProductSkuLicense(licenseId);
  }

  @Get('/:productId/skus/:skuId/licenses')
  @Roles(UserType.ADMIN)
  async getProductSkuLicenses(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
  ) {
    return await this.productsService.getProductSkuLicenses(productId, skuId);
  }

  @Put('/:productId/skus/:skuId/licenses/:licenseKeyId')
  @Roles(UserType.ADMIN)
  async updateProductSkuLicense(
    @Param('productId') productId: string,
    @Param('skuId') skuId: string,
    @Param('licenseKeyId') licenseKeyId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return await this.productsService.updateProductSkuLicense(
      productId,
      skuId,
      licenseKeyId,
      licenseKey,
    );
  }

  @Post('/:productId/reviews')
  @Roles(UserType.CUSTOMER)
  async addProductReview(
    @Param('productId') productId: string,
    @Body() addProductReview: AddProductReviewDto,
    @Req() req: any,
  ) {
    return await this.productsService.addProductReview(
      productId,
      addProductReview,
      req.user,
    );
  }

  @Delete('/:productId/reviews/:reviewId')
  async removeProductReview(
    @Param('productId') productId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return await this.productsService.removeProductReview(productId, reviewId);
  }
}

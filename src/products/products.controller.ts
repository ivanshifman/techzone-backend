import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from 'src/shared/middleware/role.decorator';
import { UserType } from 'src/shared/schema/users';
import { GetProductQueryDto } from './dto/get-product-quey-dto';
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
  async update(@Param('id') id: string, @Body() updateProductDto: CreateProductDto) {
    return await this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.productsService.removeProduct(id);
  }

  @Post('/:id/image')
  @Roles(UserType.ADMIN)
  @UseInterceptors(
    function () {
      const configService = new ConfigService();
      return DynamicFileInterceptor.create(configService);
    }(),
  )
  async uploadProductImage(@Param('id') id: string, @UploadedFile() file: ParameterDecorator) {
    return await this.productsService.uploadProductImage(id, file);
  }
}

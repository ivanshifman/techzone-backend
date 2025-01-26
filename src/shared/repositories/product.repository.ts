import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Products } from "../schema/products";
import { Model } from "mongoose";
import { CreateProductDto } from "src/products/dto/create-product.dto";

@Injectable()
export class ProductRepository {
    constructor(@InjectModel(Products.name) private readonly productModel: Model<Products>) {}

    async create(product: CreateProductDto) {
        return await this.productModel.create(product);
    }
}
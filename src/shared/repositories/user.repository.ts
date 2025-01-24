import { InjectModel } from "@nestjs/mongoose";
import { Users } from "../schema/users";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserRepository {
    constructor(@InjectModel(Users.name) private readonly userModel: Model<Users>) {}

    async findOne(query: any) {
        return await this.userModel.findOne(query);
    }

    async find(query: any) {
        return await this.userModel.find(query);
    }

    async create(user: Record<string, any>) {
        return await this.userModel.create(user);
    }

    async updateOne(query: any, update: any) {
        return await this.userModel.updateOne(query, update);
    }


    async updateVerify(query: any, data: Record<string, any>) {
        return await this.userModel.updateOne(query, data, { new: true });
    }
}
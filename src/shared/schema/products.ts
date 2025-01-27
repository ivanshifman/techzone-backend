import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export enum categoryType {
  operatingSystem = 'Operating System',
  applicationSoftware = 'Application Software',
}

export enum platformType {
  windows = 'Windows',
  mac = 'Mac',
  linux = 'Linux',
  android = 'Android',
  ios = 'iOS',
}

export enum baseType {
  computer = 'Computer',
  mobile = 'Mobile',
}

@Schema({ timestamps: true, versionKey: false })
export class Feedbackers extends Document {
  @Prop({})
  customerId!: string;

  @Prop({})
  customerName!: string;

  @Prop({})
  rating!: number;

  @Prop({})
  feedbackMsg!: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedbackers);

@Schema({ timestamps: true, versionKey: false })
export class SkuDetails extends Document {
  @Prop({})
  skuName!: string;

  @Prop({})
  price!: number;

  @Prop({})
  validity!: number;

  @Prop({})
  lifetime!: boolean;

  @Prop({})
  stripePriceId!: string;

  @Prop({})
  skuCode?: string;
}

export const skuDetailsSchema = SchemaFactory.createForClass(SkuDetails);

@Schema({ timestamps: true, versionKey: false })
export class Products {
  @Prop({ required: true, unique: true })
  productName!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({
    default:
      'https://static.vecteezy.com/system/resources/thumbnails/016/808/173/small_2x/camera-not-allowed-no-photography-image-not-available-concept-icon-in-line-style-design-isolated-on-white-background-editable-stroke-vector.jpg',
  })
  image?: string;

  @Prop({ required: true, enum: categoryType, index: true })
  category!: string;

  @Prop({ required: true, enum: platformType, index: true })
  platformType!: string;

  @Prop({ required: true, enum: baseType, index: true })
  baseType!: string;

  @Prop({ required: true })
  productUrl!: string;

  @Prop({ required: true })
  downloadUrl!: string;

  @Prop({})
  avgRating!: number;

  @Prop([{ type: FeedbackSchema }])
  feedbackDetails!: Feedbackers[];

  @Prop([{ type: skuDetailsSchema }])
  skuDetails!: SkuDetails[];

  @Prop({ type: Object })
  imageDetails!: Record<string, any>;

  @Prop({})
  requirementSpecification!: Record<string, any>[];

  @Prop({})
  highlights!: string[];

  @Prop({})
  stripeProductId!: string;
}

export const ProductSchema = SchemaFactory.createForClass(Products);
ProductSchema.plugin(mongoosePaginate);
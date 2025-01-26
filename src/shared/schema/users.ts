import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

@Schema({ timestamps: true, versionKey: false })
export class Users extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, minlength: 6 })
  password!: string;

  @Prop({ required: true, enum: UserType, default: UserType.CUSTOMER })
  type!: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: null })
  otp!: string;

  @Prop({ default: null })
  otpExpireTime!: Date;
}

export const UserSchema = SchemaFactory.createForClass(Users);

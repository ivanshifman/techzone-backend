import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  isURL,
  Matches,
} from 'class-validator';
import {
  baseType,
  categoryType,
  platformType,
  SkuDetails,
} from 'src/shared/schema/products';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @Matches(/^\S*$/, { message: 'Image cannot contain spaces' })
  image?: string;

  @IsOptional()
  imageDetails?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  @IsEnum(categoryType)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(platformType)
  platformType!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(baseType)
  baseType!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @Matches(/^\S*$/, { message: 'ProductUrl cannot contain spaces' })
  productUrl!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @Matches(/^\S*$/, { message: 'DownloadUrl cannot contain spaces' })
  downloadUrl!: string;

  @IsArray()
  @IsNotEmpty()
  requirementSpecification!: Record<string, any>[];

  @IsArray()
  @IsNotEmpty()
  highlights!: string[];

  @IsOptional()
  @IsArray()
  skuDetails!: SkuDetails[];

  @IsOptional()
  stripeProductId?: string;
}

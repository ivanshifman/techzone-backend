import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductSkuDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  skuName!: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  validity!: number;

  @IsNotEmpty()
  @IsBoolean()
  lifetime!: boolean;

  @IsOptional()
  stripePriceId?: string;

  @IsOptional()
  skuCode?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  stock!: number;
}

export class ProductSkuDtoArr {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProductSkuDto)
  @ArrayMinSize(1)
  skuDetails!: ProductSkuDto[];
}

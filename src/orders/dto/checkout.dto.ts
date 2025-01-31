import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  skuPriceId!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  skuId!: string;
}

export class CheckoutDtoArr {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CheckoutDto)
  readonly checkoutDetails!: CheckoutDto[];
}

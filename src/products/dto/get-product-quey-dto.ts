import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  platformType?: string;

  @IsOptional()
  @IsString()
  baseType?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsEnum(SortOrder)
  avgRating?: SortOrder;

  @IsOptional()
  @IsEnum(SortOrder)
  createdAt?: SortOrder;

  @IsOptional()
  @IsString()
  homePage?: string;
}

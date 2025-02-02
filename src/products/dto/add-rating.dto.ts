import { IsNumber, IsString, Min, Max, IsNotEmpty } from 'class-validator';

export class AddProductReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating!: number;

  @IsString()
  @IsNotEmpty()
  review!: string;
}

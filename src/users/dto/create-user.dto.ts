/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { UserType } from 'src/shared/schema/users';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return value;
  })
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^\S*$/, { message: 'Password cannot contain spaces' })
  password!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([UserType.ADMIN, UserType.CUSTOMER])
  type!: string;

  @IsString()
  @IsOptional()
  secretToken?: string;

  isVerified?: boolean;
}

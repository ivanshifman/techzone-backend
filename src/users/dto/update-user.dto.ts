import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return value;
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  oldPassword?: string;

  @ValidateIf((o) => o.oldPassword)
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^\S*$/, { message: 'New password cannot contain spaces' })
  newPassword?: string;
}

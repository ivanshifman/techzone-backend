import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, MinLength } from "class-validator";
import { UserType } from "src/shared/schema/users";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    name!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: "Password must be at least 6 characters long" })
    password!: string;

    @IsNotEmpty()
    @IsString()
    @IsIn([UserType.ADMIN, UserType.COSTUMER])
    type!: string;

    @IsString()
    @IsOptional()
    secretToken?: string;

    isVerified?: boolean;
}

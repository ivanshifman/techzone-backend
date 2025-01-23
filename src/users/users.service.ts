import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { UserType } from 'src/shared/schema/users';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/shared/repositories/user.repository';
import {
  comparePassword,
  generateHashPassword,
} from 'src/shared/utility/password-manager';
import { sendMail } from 'src/shared/utility/mail-handler';
import { AuthService } from 'src/shared/utility/token-generator';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userDb: UserRepository,
    private readonly authService: AuthService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );

      if (
        createUserDto.type === UserType.ADMIN &&
        createUserDto.secretToken !==
          this.configService.get<string>('ADMIN_SECRET_TOKEN')
      ) {
        throw new InternalServerErrorException('Not allowed to create admin');
      } else {
        createUserDto.isVerified = true;
      }

      const user = await this.userDb.findOne({ email: createUserDto.email });

      if (user) {
        throw new ConflictException('User with this email already exists');
      }

      const otp = Math.floor(Math.random() * 900000) + 100000;

      const otpExpireTime = new Date();
      otpExpireTime.setMinutes(otpExpireTime.getMinutes() + 10);

      const newUser = await this.userDb.create({
        ...createUserDto,
        otp,
        otpExpireTime,
      });

      const emailTemplate = this.configService.get<string>(
        'EMAIL_TEMPLATE_VERIFY_EMAIL',
      );

      if (!emailTemplate) {
        throw new InternalServerErrorException(
          'An unexpected error occurred. Please try again later.',
        );
      }

      if (newUser.type !== UserType.ADMIN) {
        await sendMail(
          newUser.email,
          emailTemplate,
          'Email verification - Techzone',
          {
            customerName: newUser.name,
            customerEmail: newUser.email,
            otp,
          },
        );
      }

      return {
        success: true,
        message:
          newUser.type === UserType.ADMIN
            ? 'Admin created successfully'
            : 'Please activate your account by verifying your email. We have sent you a wmail with the otp',
        result: { email: newUser.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      const userExists = await this.userDb.findOne({ email });
      if (!userExists) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (!userExists.isVerified) {
        throw new UnauthorizedException('Please verify your account');
      }

      const isPasswordMatch = await comparePassword(
        password,
        userExists.password,
      );
      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.authService.generateAuthToken(String(userExists._id));

      await this.userDb.updateOne(
        { email: userExists.email },
        { $unset: { token: '' } },
      );

      return {
        success: true,
        message: 'Login successful',
        result: {
          user: {
            name: userExists.name,
            email: userExists.email,
          },
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

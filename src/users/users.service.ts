import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { mailTemplates } from 'src/shared/utility/mail-templates';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userDb: UserRepository,
    private readonly authService: AuthService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<{
    message: string;
    result: any;
    success: boolean;
  }> {
    try {
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );

      if (createUserDto.type === UserType.ADMIN) {
        createUserDto.isVerified = true;
      }

      if (
        createUserDto.type === UserType.ADMIN &&
        createUserDto.secretToken !==
          this.configService.get<string>('ADMIN_SECRET_TOKEN')
      ) {
        throw new InternalServerErrorException('Not allowed to create admin');
      } else if (createUserDto.type === UserType.CUSTOMER) {
        createUserDto.isVerified = false;
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

      const emailTemplate = mailTemplates['verifyMail']?.(
        newUser.name,
        newUser.email,
        otp.toString(),
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

  async login(loginDto: LoginDto): Promise<{
    success: boolean;
    message: string;
    result: any;
  }> {
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

      const token = this.authService.generateAuthToken(
        String(userExists._id),
        String(userExists.type),
      );

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
            type: userExists.type,
          },
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(
    otp: string,
    email: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const user = await this.userDb.findOne({ email });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (user.otp !== otp) {
        throw new UnauthorizedException('Invalid otp');
      }
      if (user.otpExpireTime < new Date()) {
        throw new UnauthorizedException('Otp expired');
      }

      await this.userDb.updateVerify({ email }, { $set: { isVerified: true } });

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async sendOtpEmail(email: string): Promise<{
    success: boolean;
    message: string;
    result: any;
  }> {
    try {
      const user = await this.userDb.findOne({ email });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (user.isVerified) {
        throw new InternalServerErrorException('Email already verified');
      }
      const otp = Math.floor(Math.random() * 900000) + 100000;

      const otpExpireTime = new Date();
      otpExpireTime.setMinutes(otpExpireTime.getMinutes() + 10);

      await this.userDb.updateVerify(
        { email },
        { $set: { otp, otpExpireTime } },
      );

      const emailTemplate = mailTemplates['verifyMail']?.(
        user.name,
        user.email,
        otp.toString(),
      );

      if (!emailTemplate) {
        throw new InternalServerErrorException(
          'An unexpected error occurred. Please try again later.',
        );
      }

      await sendMail(
        user.email,
        emailTemplate,
        'Email verification - Techzone',
      );

      return {
        success: true,
        message: 'Otp sent successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    result: any;
  }> {
    try {
      const user = await this.userDb.findOne({ email });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const newPassword = Math.random().toString(36).substring(2, 12);
      const hashedPassword = await generateHashPassword(newPassword);

      await this.userDb.updateVerify(
        { _id: user._id },
        { $set: { password: hashedPassword } },
      );

      const loginUrl = this.configService.get<string>('LOGIN_URL');
      if (!loginUrl) {
        throw new InternalServerErrorException(
          'Login URL configuration is missing. Please reach out to the administrator.',
        );
      }

      const emailTemplate = mailTemplates['forgotPassword']?.(
        user.name,
        user.email,
        newPassword,
        loginUrl,
      );

      if (!emailTemplate) {
        throw new InternalServerErrorException(
          'An unexpected error occurred. Please try again later.',
        );
      }

      await sendMail(user.email, emailTemplate, 'Password Reset - Techzone');

      return {
        success: true,
        message: 'Password reset email sent successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(type: string): Promise<{
    success: boolean;
    message: string;
    result: any;
  }> {
    try {
      const users = await this.userDb.find({
        type,
      });

      if (!users || users.length === 0) {
        throw new NotFoundException('No users found for the specified type');
      }

      return {
        success: true,
        message: 'Users fetched successfully',
        result: users,
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePasswordOrName(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ success: boolean; message: string; result: any }> {
    try {
      const { oldPassword, newPassword, name } = updateUserDto;
      if (!newPassword && !name) {
        throw new BadRequestException('Please provide name or password');
      }

      const user = await this.userDb.findOne({ _id: id });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (newPassword) {
        if (!oldPassword) {
          throw new BadRequestException(
            'Old password is required to update password',
          );
        }

        const isPasswordMatch = await comparePassword(
          oldPassword,
          user.password,
        );
        if (!isPasswordMatch) {
          throw new UnauthorizedException('Invalid credentials');
        }

        const hashedPassword = await generateHashPassword(newPassword);
        await this.userDb.updateVerify(
          { _id: user._id },
          { $set: { password: hashedPassword } },
        );
      }

      if (name) {
        await this.userDb.updateVerify({ _id: id }, { $set: { name } });
      }

      const updatedUser = await this.userDb.findOne({ _id: id });

      return {
        success: true,
        message: 'User updated successfully',
        result: {
          name: updatedUser?.name || user.name,
          email: updatedUser?.email || user.email,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

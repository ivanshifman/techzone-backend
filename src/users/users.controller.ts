import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Res, Put, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { Response } from 'express';
import { Roles } from 'src/shared/middleware/role.decorator';
import { UserType } from 'src/shared/schema/users';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const loginRes = await this.usersService.login(loginDto);
    if (loginRes.success) {
      response.cookie('auth_token', loginRes.result?.token, { httpOnly: true, maxAge: 300000 });
    }
    return loginRes;
  }

  @Get('verify-email/:otp/:email')
  async verifyEmail(@Param('otp') otp: string, @Param('email') email: string) {
    return await this.usersService.verifyEmail(otp, email);
  }

  @Get('send-otp-email/:email')
  async sendOtpEmail(@Param('email') email: string) {
    return await this.usersService.sendOtpEmail(email)
  }

  @Put('/logout')
  async logout(@Res() response: Response) {
    response.clearCookie('auth_token');
    return response.status(HttpStatus.OK).json({
      success: true,
      message: 'Logout successfully',
    });
  }

  @Get('forgot-password/:email')
  async forgotPassword(@Param('email') email: string) {
    return await this.usersService.forgotPassword(email);
  }

  @Get()
  @Roles(UserType.ADMIN)
  async findAll(@Query('type') type: string) {
    return await this.usersService.findAll(type);
  }

  @Patch('/update-name-password/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updatePasswordOrName(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto): Promise<{
    message: string;
    token: string;
    user: UserResponseDto;
  }> {
    const result = await this.userService.register(registerUserDto);
    return {
      message: '注册成功',
      token: result.token,
      user: result.user,
    };
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto): Promise<{
    message: string;
    token: string;
    user: UserResponseDto;
  }> {
    const result = await this.userService.login(loginUserDto);
    return {
      message: '登录成功',
      token: result.token,
      user: result.user,
    };
  }

  // 未来可以添加获取用户信息的路由等
  // @Get('profile')
  // @UseGuards(AuthGuard('jwt'))
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}

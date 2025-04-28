import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsNotEmpty({ message: '加密后的密码不能为空' })
  @IsString()
  encryptedPassword: string;
}

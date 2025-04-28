import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(20, { message: '用户名不能超过20个字符' })
  username: string;

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsNotEmpty({ message: '加密后的密码不能为空' })
  @IsString()
  encryptedPassword: string;
}

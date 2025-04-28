import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = 'your-encryption-key-here';
  }

  private decryptPassword(encryptedPassword: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption resulted in empty string');
      }
      if (decrypted.length < 6) {
        throw new Error('Decrypted password is too short');
      }
      return decrypted;
    } catch (error) {
      console.error('Password decryption error:', error);
      throw new BadRequestException('密码解密失败，请检查密码是否正确提交');
    }
  }

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { username, email, encryptedPassword } = registerUserDto;

    const password = this.decryptPassword(encryptedPassword);

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });
    if (existingUser) {
      throw new ConflictException('用户名或邮箱已被使用');
    }

    const user = this.userRepository.create({ username, email, password });

    try {
      await this.userRepository.save(user);
      const payload = { sub: user.id, username: user.username };
      const token = await this.jwtService.signAsync(payload);

      return { user: new UserResponseDto(user), token };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('注册数据库错误:', error);
      throw new InternalServerErrorException('注册失败，请稍后重试');
    }
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { email, encryptedPassword } = loginUserDto;

    const password = this.decryptPassword(encryptedPassword);

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'username', 'email', 'password', 'createdAt'],
    });

    if (!user) {
      throw new BadRequestException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('邮箱或密码错误');
    }

    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload);
    return { user: new UserResponseDto(user), token };
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
}

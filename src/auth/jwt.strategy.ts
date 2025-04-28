import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service'; // 注入 UserService 来验证用户
import { JwtPayload } from './jwt-payload.interface'; // 导入 JwtPayload
import { UserResponseDto } from '../user/dto/user-response.dto'; // 导入 UserResponseDto

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从 Authorization Header 提取 Token
      ignoreExpiration: false, // 不忽略过期
      secretOrKey: 'yidong', // 使用与 JwtModule 配置相同的密钥
      // 可以从 ConfigService 读取密钥: process.env.JWT_SECRET 或 configService.get('JWT_SECRET')
    });
  }

  // Passport 会自动调用这个方法来验证 Token payload
  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    // payload 是我们登录时签发的 JWT 内容 { sub: userId, username: username }
    // 可以在这里添加额外的验证逻辑，例如检查用户是否仍然存在或被禁用
    const user = await this.userService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在或Token无效');
    }
    // 返回 UserResponseDto 实例，它不包含密码
    return new UserResponseDto(user);
  }
}

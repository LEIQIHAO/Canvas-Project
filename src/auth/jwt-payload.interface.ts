import { UserResponseDto } from '../user/dto/user-response.dto';

// 扩展 Express 的 Request 类型，使其包含 user 属性
// 确保这个文件被 TypeScript 编译器正确加载
declare global {
  namespace Express {
    // 定义 Express.User 的类型为 UserResponseDto
    // 这应该与 JwtStrategy.validate 的返回类型一致
    interface User extends UserResponseDto {}
  }
}

// 定义 JWT 载荷的接口
export interface JwtPayload {
  sub: string; // 用户 ID
  username: string;
  // 可以添加其他信息
}

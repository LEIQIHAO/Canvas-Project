import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canvas } from './entities/canvas.entity';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller'; // 稍后创建
import { UserModule } from '../user/user.module'; // 导入 UserModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Canvas]),
    UserModule, // 导入 UserModule 以使用 UserRepository
  ],
  providers: [CanvasService],
  controllers: [CanvasController], // 添加控制器
  exports: [CanvasService, TypeOrmModule], // 按需导出
})
export class CanvasModule {}

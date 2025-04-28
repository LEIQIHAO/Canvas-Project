import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 配置 CORS
  app.enableCors({
    origin: 'http://localhost:3000', // 明确指定允许的前端来源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // 明确允许的方法 (可选，但推荐)
    credentials: true, // 允许请求携带凭证 (如 Cookies, Authorization headers)
  });

  // 全局启用验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除 DTO 中未定义的属性
      transform: true, // 自动转换 DTO 属性类型
      forbidNonWhitelisted: false, // 设置为 false，允许 DTO 外的字段，但会被 whitelist 移除
      transformOptions: {
        enableImplicitConversion: true, // 允许隐式类型转换
      },
    }),
  );

  // 全局启用 ClassSerializerInterceptor
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(5001);
}
bootstrap();

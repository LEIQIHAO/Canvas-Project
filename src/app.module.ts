import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CanvasModule } from './canvas/canvas.module';
import { TaskService } from './task.service';
@Module({
  imports: [
    // 配置环境变量模块
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
    // 引入定时任务
    ScheduleModule.forRoot(),
    // 引入mysql
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', '121.37.219.159'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', 'book-v123'),
        database: configService.get<string>('DB_DATABASE', 'canvas-project'),
        timezone: '+08:00',
        synchronize: true,
        logging: configService.get<boolean>('DB_LOGGING', true),
        entities: [],
        logger: 'file',
        insecureAuth: true,
        connectorPackage: 'mysql2',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    // jwt校验
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'yidong'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    CanvasModule,
    // 在这里添加其他模块，例如 UserModule, HouseModule 等
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TaskService,
    // 在这里添加其他全局守卫或服务，例如 LoginGuard, TaskService 等
  ],
})
export class AppModule {}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UnauthorizedException, // 用于 req.user 不存在的情况
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // 使用 Passport 的 AuthGuard
import { CanvasService } from './canvas.service';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { UpdateCanvasDto } from './dto/update-canvas.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { Canvas } from './entities/canvas.entity'; // 导入 Canvas 实体用于类型提示
import { Request as ExpressRequest } from 'express'; // 导入 Express Request 类型
import { UserResponseDto } from '../user/dto/user-response.dto'; // 导入 UserResponseDto

@Controller('canvas') // 路由前缀 /canvases
@UseGuards(AuthGuard('jwt')) // 对此 Controller 下的所有路由应用 JWT 认证守卫
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  private getUserIdFromRequest(req: ExpressRequest): string {
    // 明确断言 req.user 的类型为 UserResponseDto
    const user = req.user as UserResponseDto;

    // 检查 id 是否存在
    if (!user?.id) {
      throw new UnauthorizedException('无法从请求中获取有效的用户信息');
    }
    return user.id;
  }

  // 获取用户拥有的或协作的所有画布项目
  @Get('my-canvases') // GET /canvases/my-canvases
  async findUserCanvases(@Request() req: ExpressRequest) {
    const userId = this.getUserIdFromRequest(req);
    const canvases = await this.canvasService.findUserCanvases(userId);
    return {
      statusCode: HttpStatus.OK,
      message: '获取用户画布列表成功',
      data: canvases,
    };
  }

  // 创建新画布项目
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCanvasDto: CreateCanvasDto,
    @Request() req: ExpressRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: Canvas; // 响应体包含完整的 Canvas 对象
  }> {
    const userId = this.getUserIdFromRequest(req);
    const canvas = await this.canvasService.create(createCanvasDto, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: '创建画布成功',
      data: canvas, // 在 data 中返回完整的 canvas 对象
    };
  }

  // 获取单个画布项目
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: ExpressRequest,
  ) {
    // ParseUUIDPipe 验证 id 是否为有效的 UUID
    const userId = this.getUserIdFromRequest(req);
    const canvas = await this.canvasService.findOneById(id, userId);
    return {
      statusCode: HttpStatus.OK,
      message: '获取画布详情成功',
      data: canvas,
    };
  }

  // 更新画布项目
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCanvasDto: UpdateCanvasDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = this.getUserIdFromRequest(req);
    const canvas = await this.canvasService.update(id, updateCanvasDto, userId);
    return {
      statusCode: HttpStatus.OK,
      message: '更新画布成功',
      data: canvas,
    };
  }

  // 删除画布项目
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 成功删除通常返回 204 No Content
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: ExpressRequest,
  ) {
    const userId = this.getUserIdFromRequest(req);
    await this.canvasService.remove(id, userId);
    // 成功时不需要返回消息体
  }

  // 添加协作者
  @Post(':id/collaborators')
  async addCollaborator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addCollaboratorDto: AddCollaboratorDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = this.getUserIdFromRequest(req);
    const canvas = await this.canvasService.addCollaborator(
      id,
      addCollaboratorDto,
      userId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: '添加协作者成功',
      data: canvas, // 返回更新后的画布信息
    };
  }
}

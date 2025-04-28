import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Canvas } from './entities/canvas.entity';
import { User } from '../user/entities/user.entity';
import { CreateCanvasDto } from './dto/create-canvas.dto';
import { UpdateCanvasDto } from './dto/update-canvas.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(Canvas)
    private canvasRepository: Repository<Canvas>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 获取用户拥有的或协作的所有画布
  async findUserCanvases(userId: string): Promise<Canvas[]> {
    try {
      // 查找用户拥有的画布，按更新时间倒序
      const ownedCanvases = await this.canvasRepository.find({
        where: { ownerId: userId },
        relations: ['owner', 'collaborators'],
        select: {
          owner: { id: true, username: true, email: true },
          collaborators: { id: true, username: true, email: true },
        },
        order: { updatedAt: 'DESC' }, // 添加排序条件
      });

      // 查找用户作为协作者的画布ID
      const userWithCollaborations = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['collaboratingCanvases'],
      });

      let collaboratingCanvases: Canvas[] = [];
      if (
        userWithCollaborations &&
        userWithCollaborations.collaboratingCanvases.length > 0
      ) {
        const collaboratingCanvasIds =
          userWithCollaborations.collaboratingCanvases.map((c) => c.id);
        // 根据ID查找协作的画布，按更新时间倒序
        collaboratingCanvases = await this.canvasRepository.find({
          where: { id: In(collaboratingCanvasIds) },
          relations: ['owner', 'collaborators'],
          select: {
            owner: { id: true, username: true, email: true },
            collaborators: { id: true, username: true, email: true },
          },
          order: { updatedAt: 'DESC' }, // 添加排序条件
        });
      }

      // 合并两个已排序的列表
      // 注意：简单合并后再按 updatedAt 排序会更精确，但可能增加复杂度
      // 目前的合并方式是分别排序后合并，最终列表的整体排序可能不完全精确
      // 如果需要严格排序，可以考虑获取所有相关 ID 后一次性查询并排序
      const allCanvases = [...ownedCanvases, ...collaboratingCanvases];
      // 去重（基于ID），保持合并后的相对顺序
      const uniqueCanvasesMap = new Map<string, Canvas>();
      allCanvases.forEach((canvas) => {
        if (!uniqueCanvasesMap.has(canvas.id)) {
          uniqueCanvasesMap.set(canvas.id, canvas);
        }
      });
      const uniqueCanvases = Array.from(uniqueCanvasesMap.values());

      // 对最终的合并去重列表进行排序，确保整体顺序正确
      uniqueCanvases.sort((a, b) => {
        // 确保比较的是 Date 对象的时间戳
        const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
        const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
        return timeB - timeA; // 降序排列
      });

      return uniqueCanvases;
    } catch (error) {
      console.error('Error finding user canvases:', error);
      throw new InternalServerErrorException('获取画布列表失败');
    }
  }

  // 获取单个画布（用户必须是所有者或协作者）
  async findOneById(id: string, userId: string): Promise<Canvas> {
    try {
      const canvas = await this.canvasRepository.findOne({
        where: { id }, // 先根据ID查找
        relations: ['owner', 'collaborators'],
        select: {
          owner: { id: true, username: true, email: true },
          collaborators: { id: true, username: true, email: true },
        },
      });

      if (!canvas) {
        throw new NotFoundException('画布未找到');
      }

      // 检查权限
      const isOwner = canvas.ownerId === userId;
      const isCollaborator = canvas.collaborators.some((c) => c.id === userId);

      if (!isOwner && !isCollaborator) {
        throw new ForbiddenException('无权访问此画布');
      }

      return canvas;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Error finding canvas by id:', error);
      throw new InternalServerErrorException('获取画布详情失败');
    }
  }

  // 创建画布
  async create(
    createCanvasDto: CreateCanvasDto,
    userId: string,
  ): Promise<Canvas> {
    const { title } = createCanvasDto;
    // 查找 owner 不是必须的，可以直接使用 userId 设置 ownerId
    // const owner = await this.userRepository.findOneBy({ id: userId });
    // if (!owner) {
    //   throw new InternalServerErrorException('无法找到创建者信息');
    // }

    const canvas = this.canvasRepository.create({
      title,
      ownerId: userId, // 直接设置 ownerId
      content: {}, // 确保新画布有默认空内容
    });

    try {
      await this.canvasRepository.save(canvas);
      // 保存后，调用 findOneById 获取包含关联信息的完整对象并返回
      // findOneById 会自动处理权限检查和填充 owner/collaborators
      return this.findOneById(canvas.id, userId);
    } catch (error) {
      console.error('Error creating canvas:', error);
      throw new InternalServerErrorException('创建画布失败');
    }
  }

  // 更新画布（用户必须是所有者或协作者）
  async update(
    id: string,
    updateCanvasDto: UpdateCanvasDto,
    userId: string,
  ): Promise<Canvas> {
    const canvas = await this.findOneById(id, userId); // findOneById 包含了权限检查

    // 更新字段
    if (updateCanvasDto.title !== undefined) {
      canvas.title = updateCanvasDto.title;
    }
    if (updateCanvasDto.content !== undefined) {
      canvas.content = updateCanvasDto.content;
    }
    // updatedAt 会由 @UpdateDateColumn 自动更新

    try {
      await this.canvasRepository.save(canvas);
      // 返回更新后的完整信息
      return this.findOneById(id, userId);
    } catch (error) {
      console.error('Error updating canvas:', error);
      throw new InternalServerErrorException('更新画布失败');
    }
  }

  // 删除画布（用户必须是所有者）
  async remove(id: string, userId: string): Promise<void> {
    const canvas = await this.canvasRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!canvas) {
      // 如果画布不存在，或者用户不是所有者，都视为未找到
      throw new NotFoundException('画布未找到或无权删除');
    }

    try {
      await this.canvasRepository.remove(canvas);
    } catch (error) {
      console.error('Error removing canvas:', error);
      throw new InternalServerErrorException('删除画布失败');
    }
  }

  // 添加协作者（用户必须是所有者）
  async addCollaborator(
    id: string,
    addCollaboratorDto: AddCollaboratorDto,
    userId: string,
  ): Promise<Canvas> {
    const canvas = await this.canvasRepository.findOne({
      where: { id, ownerId: userId },
      relations: ['owner', 'collaborators'], // 需要加载现有协作者
    });

    if (!canvas) {
      throw new NotFoundException('画布未找到或您不是所有者');
    }

    const { email } = addCollaboratorDto;
    const collaborator = await this.userRepository.findOneBy({ email });

    if (!collaborator) {
      throw new NotFoundException('要添加的协作者用户未找到');
    }

    if (collaborator.id === userId) {
      throw new BadRequestException('不能将自己添加为协作者');
    }

    // 检查是否已经是协作者
    const isAlreadyCollaborator = canvas.collaborators.some(
      (c) => c.id === collaborator.id,
    );
    if (isAlreadyCollaborator) {
      return canvas; // 已经是协作者，直接返回当前状态
    }

    // 添加协作者
    canvas.collaborators.push(collaborator);

    try {
      await this.canvasRepository.save(canvas);
      // 返回更新后的完整信息
      return this.findOneById(id, userId); // 重新查询以包含填充信息
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw new InternalServerErrorException('添加协作者失败');
    }
  }

  // TODO: 可能需要移除协作者的功能
}

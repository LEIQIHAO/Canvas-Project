import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';

export class UpdateCanvasDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '画布标题不能为空' })
  @MaxLength(255, { message: '画布标题不能超过255个字符' })
  title?: string;

  @IsOptional()
  @IsObject({ message: '画布内容必须是一个对象' })
  content?: Record<string, any>;
}

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCanvasDto {
  @IsNotEmpty({ message: '画布标题不能为空' })
  @IsString()
  @MinLength(1, { message: '画布标题不能为空' })
  @MaxLength(255, { message: '画布标题不能超过255个字符' })
  title: string;
}

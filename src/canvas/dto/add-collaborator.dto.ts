import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddCollaboratorDto {
  @IsNotEmpty({ message: '协作者邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的协作者邮箱地址' })
  email: string;
}

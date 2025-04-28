import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { IsEmail, MinLength, MaxLength } from 'class-validator'; // For validation
import { Transform } from 'class-transformer'; // 导入 Transform
import { format } from 'date-fns-tz'; // 从 date-fns-tz 导入 format
import { addHours } from 'date-fns'; // 从 date-fns 导入 addHours
import * as bcrypt from 'bcryptjs';
import { Canvas } from '../../canvas/entities/canvas.entity'; // Adjust path as needed

// Function to format date, handling potential null/undefined
const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  try {
    // 手动添加 8 小时
    const adjustedDate = addHours(date, 8);
    // 使用调整后的日期进行格式化
    return format(adjustedDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' });
    // 或者直接格式化 adjustedDate
    // return format(adjustedDate, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Date formatting error:', error);
    return date.toISOString(); // Fallback to ISO string if formatting fails
  }
};

@Entity('users') // Define the table name
export class User {
  @PrimaryGeneratedColumn('uuid') // Use UUID for primary key
  id: string;

  @Column({
    type: 'varchar',
    length: 50, // Increased length slightly
    unique: true,
    nullable: false,
  })
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(20, { message: '用户名不能超过20个字符' })
  username: string;

  @Column({
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @Column({
    type: 'varchar',
    nullable: false,
    select: false, // Prevent password from being selected by default
  })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;

  @CreateDateColumn()
  @Transform(({ value }) => formatDate(value)) // 添加 Transform
  createdAt: Date | string; // 修改类型提示

  // One-to-many relationship with Canvas (Owner)
  @OneToMany(() => Canvas, (canvas) => canvas.owner)
  ownedCanvases: Canvas[];

  // Many-to-many relationship with Canvas (Collaborator)
  @ManyToMany(() => Canvas, (canvas) => canvas.collaborators)
  // No @JoinTable needed here, it's defined on the owning side (Canvas)
  collaboratingCanvases: Canvas[];

  // Hash password before inserting or updating
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      // Only hash if password is provided/modified
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Method to compare passwords (similar to Mongoose method)
  async comparePassword(candidatePassword: string): Promise<boolean> {
    // Need to fetch the password explicitly if it was not selected
    // This comparison should ideally happen in the AuthService where the user entity
    // including the password can be fetched.
    // For simplicity here, we assume `this.password` is available, but be mindful of the `select: false`.
    if (!this.password) {
      // This case should be handled by fetching the user with the password field
      throw new Error('Password field not available for comparison.');
    }
    return bcrypt.compare(candidatePassword, this.password);
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { format } from 'date-fns-tz';
import { addHours } from 'date-fns';
import { User } from '../../user/entities/user.entity'; // Assuming User entity path

// Function to format date, handling potential null/undefined
const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  try {
    // 手动添加 8 小时
    const adjustedDate = addHours(date, 8);
    // 使用调整后的日期进行格式化
    return format(adjustedDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' });
    // 或者直接格式化 adjustedDate，因为 Date 对象内部是 UTC 时间戳，加了8小时后格式化出来就等同于+8区时间
    // return format(adjustedDate, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Date formatting error:', error);
    return date.toISOString(); // Fallback to ISO string if formatting fails
  }
};

@Entity('canvases') // Define the table name
export class Canvas {
  @PrimaryGeneratedColumn('uuid') // Use UUID for primary key
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'json', // Use JSON type for object content
    nullable: true, // Allow null
    // default: '{}', // REMOVED: MySQL doesn't allow default on JSON
  })
  content: Record<string, any>;

  // Many-to-one relationship with User (Owner)
  @ManyToOne(() => User, (user) => user.ownedCanvases, {
    nullable: false, // Owner is required
    onDelete: 'CASCADE', // Optional: delete canvas if owner is deleted
  })
  @JoinColumn({ name: 'ownerId' }) // Define the foreign key column name
  owner: User;

  @Column()
  ownerId: string; // Expose the foreign key

  // Many-to-many relationship with User (Collaborators)
  @ManyToMany(() => User, (user) => user.collaboratingCanvases)
  @JoinTable({
    name: 'canvas_collaborators', // Name of the join table
    joinColumn: { name: 'canvasId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  collaborators: User[];

  @CreateDateColumn()
  @Transform(({ value }) => formatDate(value))
  createdAt: Date | string;

  @UpdateDateColumn()
  @Transform(({ value }) => formatDate(value))
  updatedAt: Date | string;
}

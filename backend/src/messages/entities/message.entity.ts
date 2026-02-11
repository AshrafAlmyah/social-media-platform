import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index(['senderId', 'receiverId'])
@Index(['conversationId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  senderId: string;

  @Column('uuid')
  receiverId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column('text')
  content: string;

  @Column({ type: 'enum', enum: ['text', 'post', 'image', 'video', 'audio'], default: 'text' })
  type: 'text' | 'post' | 'image' | 'video' | 'audio';

  @Column('uuid', { nullable: true })
  postId: string | null;

  @Column('text', { nullable: true })
  fileUrl: string | null;

  @Column('text', { nullable: true })
  fileType: string | null;

  @Column('bigint', { nullable: true })
  fileSize: number | null;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  deleted: boolean;

  @Column({ default: false })
  edited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper field to identify conversation (smaller user ID + larger user ID)
  @Column('text', { nullable: true })
  conversationId: string;
}



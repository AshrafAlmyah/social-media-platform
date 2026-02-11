import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';

export enum NotificationType {
  FOLLOW = 'follow',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  COMMENT_LIKE = 'comment_like',
  COMMENT_REPLY = 'comment_reply',
  MESSAGE = 'message',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // The user who receives the notification
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column()
  recipientId: string;

  // The user who triggered the notification (e.g., the one who liked/followed)
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column()
  actorId: string;

  // Optional: The post related to the notification
  @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post?: Post;

  @Column({ nullable: true })
  postId?: string;

  // Optional: The comment related to the notification
  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment?: Comment;

  @Column({ nullable: true })
  commentId?: string;
}













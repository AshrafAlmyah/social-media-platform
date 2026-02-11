import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.comments, { eager: true })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post: Post;

  @Column()
  postId: string;

  // Parent comment for replies
  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  parentComment?: Comment;

  @Column({ nullable: true })
  parentCommentId?: string;

  // Replies to this comment
  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  // Users who liked this comment
  @ManyToMany(() => User)
  @JoinTable({
    name: 'comment_likes',
    joinColumn: { name: 'commentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  likedBy: User[];

  // Virtual fields
  likesCount?: number;
  repliesCount?: number;
  isLiked?: boolean;
}






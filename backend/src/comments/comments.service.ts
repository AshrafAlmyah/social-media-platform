import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(
    postId: string,
    createCommentDto: CreateCommentDto,
    authorId: string,
    parentCommentId?: string,
  ) {
    // Get the post to know who to notify
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If this is a reply, get the parent comment
    let parentComment: Comment | null = null;
    if (parentCommentId) {
      parentComment = await this.commentsRepository.findOne({
        where: { id: parentCommentId },
        relations: ['author'],
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentsRepository.create({
      ...createCommentDto,
      postId,
      authorId,
      parentCommentId,
    });
    const savedComment = await this.commentsRepository.save(comment);

    // Fetch the comment with author details
    const completeComment = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author', 'parentComment'],
    });

    // Create notifications
    if (parentComment) {
      // This is a reply - notify the parent comment author
      await this.notificationsService.createCommentReplyNotification(
        authorId,
        parentComment.author.id,
        savedComment.id,
        postId,
      );
    } else {
      // This is a new comment on a post - notify the post author
      await this.notificationsService.createPostCommentNotification(
        authorId,
        post.author.id,
        postId,
        savedComment.id,
      );
    }

    return completeComment || savedComment;
  }

  async findByPost(postId: string, userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get top-level comments only (no parent)
    const comments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoin('comment.likedBy', 'likedBy')
      .leftJoin('comment.replies', 'replies')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.parentCommentId IS NULL')
      .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
      .addSelect('COUNT(DISTINCT replies.id)', 'repliesCount')
      .groupBy('comment.id')
      .addGroupBy('author.id')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    // Check which comments the user has liked
    let likedCommentIds = new Set<string>();
    if (userId && comments.entities.length > 0) {
      const commentIds = comments.entities.map((c) => c.id);
      const likedComments = await this.commentsRepository
        .createQueryBuilder('comment')
        .leftJoin('comment.likedBy', 'user')
        .where('comment.id IN (:...commentIds)', { commentIds })
        .andWhere('user.id = :userId', { userId })
        .select('comment.id')
        .getMany();
      likedCommentIds = new Set(likedComments.map((c) => c.id));
    }

    return comments.entities.map((comment, index) => ({
      ...comment,
      likesCount: parseInt(comments.raw[index].likesCount, 10),
      repliesCount: parseInt(comments.raw[index].repliesCount, 10),
      isLiked: likedCommentIds.has(comment.id),
    }));
  }

  async getReplies(commentId: string, userId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const replies = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoin('comment.likedBy', 'likedBy')
      .where('comment.parentCommentId = :commentId', { commentId })
      .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
      .groupBy('comment.id')
      .addGroupBy('author.id')
      .orderBy('comment.createdAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    // Check which replies the user has liked
    let likedReplyIds = new Set<string>();
    if (userId && replies.entities.length > 0) {
      const replyIds = replies.entities.map((r) => r.id);
      const likedReplies = await this.commentsRepository
        .createQueryBuilder('comment')
        .leftJoin('comment.likedBy', 'user')
        .where('comment.id IN (:...replyIds)', { replyIds })
        .andWhere('user.id = :userId', { userId })
        .select('comment.id')
        .getMany();
      likedReplyIds = new Set(likedReplies.map((r) => r.id));
    }

    return replies.entities.map((reply, index) => ({
      ...reply,
      likesCount: parseInt(replies.raw[index].likesCount, 10),
      isLiked: likedReplyIds.has(reply.id),
    }));
  }

  async like(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['likedBy', 'author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAlreadyLiked = comment.likedBy.some((u) => u.id === userId);

    if (!isAlreadyLiked) {
      comment.likedBy.push(user);
      await this.commentsRepository.save(comment);

      // Create comment like notification
      await this.notificationsService.createCommentLikeNotification(
        userId,
        comment.author.id,
        commentId,
        comment.postId,
      );
    }

    // Get fresh count
    const updatedComment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['likedBy'],
    });

    return {
      success: true,
      liked: true,
      likesCount: updatedComment?.likedBy?.length || comment.likedBy.length,
    };
  }

  async unlike(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['likedBy'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const initialLength = comment.likedBy.length;
    comment.likedBy = comment.likedBy.filter((u) => u.id !== userId);

    if (comment.likedBy.length !== initialLength) {
      await this.commentsRepository.save(comment);
    }

    return {
      success: true,
      liked: false,
      likesCount: comment.likedBy.length,
    };
  }

  async delete(id: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.remove(comment);
    return { success: true };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(data: {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    postId?: string;
    commentId?: string;
  }): Promise<Notification | null> {
    // Don't create notification if actor is the same as recipient
    if (data.recipientId === data.actorId) {
      return null;
    }

    // Check for duplicate notification (same type, actor, recipient, post/comment within last minute)
    const existingNotification = await this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.type = :type', { type: data.type })
      .andWhere('notification.recipientId = :recipientId', { recipientId: data.recipientId })
      .andWhere('notification.actorId = :actorId', { actorId: data.actorId })
      .andWhere(data.postId ? 'notification.postId = :postId' : 'notification.postId IS NULL', { postId: data.postId })
      .andWhere(data.commentId ? 'notification.commentId = :commentId' : 'notification.commentId IS NULL', { commentId: data.commentId })
      .andWhere('notification.createdAt > :date', { date: new Date(Date.now() - 60000) }) // Within last minute
      .getOne();

    if (existingNotification) {
      return existingNotification;
    }

    const notification = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(notification);
  }

  async getByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { recipientId: userId },
      relations: ['actor', 'post', 'comment'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  async delete(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.notificationsRepository.delete({
      id: notificationId,
      recipientId: userId,
    });

    return (result.affected ?? 0) > 0;
  }

  // Helper methods for creating specific notification types
  async createFollowNotification(followerId: string, followedUserId: string) {
    return this.create({
      type: NotificationType.FOLLOW,
      recipientId: followedUserId,
      actorId: followerId,
    });
  }

  async createPostLikeNotification(likerId: string, postAuthorId: string, postId: string) {
    return this.create({
      type: NotificationType.POST_LIKE,
      recipientId: postAuthorId,
      actorId: likerId,
      postId,
    });
  }

  async createPostCommentNotification(commenterId: string, postAuthorId: string, postId: string, commentId: string) {
    return this.create({
      type: NotificationType.POST_COMMENT,
      recipientId: postAuthorId,
      actorId: commenterId,
      postId,
      commentId,
    });
  }

  async createCommentLikeNotification(likerId: string, commentAuthorId: string, commentId: string, postId?: string) {
    return this.create({
      type: NotificationType.COMMENT_LIKE,
      recipientId: commentAuthorId,
      actorId: likerId,
      commentId,
      postId,
    });
  }

  async createCommentReplyNotification(replierId: string, parentCommentAuthorId: string, commentId: string, postId?: string) {
    return this.create({
      type: NotificationType.COMMENT_REPLY,
      recipientId: parentCommentAuthorId,
      actorId: replierId,
      commentId,
      postId,
    });
  }
}














import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private assetsService: AssetsService,
  ) {}

  // Generate conversation ID from two user IDs (always use smaller ID first)
  private getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  async create(senderId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    const { receiverId, content, type = 'text', postId, fileUrl, fileType, fileSize } = createMessageDto;

    // Verify receiver exists
    const receiver = await this.usersService.findById(receiverId);
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Prevent sending message to self
    if (senderId === receiverId) {
      throw new ForbiddenException('Cannot send message to yourself');
    }

    // Validate file size for media messages
    if ((type === 'image' || type === 'video' || type === 'audio') && fileSize) {
      if (fileSize > 15 * 1024 * 1024) {
        throw new ForbiddenException('File size must not exceed 15MB');
      }
    }

    const conversationId = this.getConversationId(senderId, receiverId);

    const message = this.messagesRepository.create({
      senderId,
      receiverId,
      content,
      type,
      postId: type === 'post' ? postId : null,
      fileUrl: (type === 'image' || type === 'video' || type === 'audio') ? fileUrl : null,
      fileType: (type === 'image' || type === 'video' || type === 'audio') ? fileType : null,
      fileSize: (type === 'image' || type === 'video' || type === 'audio') ? fileSize : null,
      conversationId,
      isRead: false,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Create notification for receiver
    await this.notificationsService.create({
      type: NotificationType.MESSAGE,
      recipientId: receiverId,
      actorId: senderId,
    });

    return savedMessage;
  }

  async getConversations(userId: string) {
    // Get all unique conversations for this user
    const conversations = await this.messagesRepository
      .createQueryBuilder('message')
      .where('message.senderId = :userId OR message.receiverId = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Group by conversationId and get the latest message for each
    const conversationMap = new Map<string, Message>();

    for (const message of conversations) {
      const convId = message.conversationId;
      const existing = conversationMap.get(convId);
      if (!existing || message.createdAt > existing.createdAt) {
        conversationMap.set(convId, message);
      }
    }

    // Get conversation details with other user info
    const conversationList = await Promise.all(
      Array.from(conversationMap.values()).map(async (lastMessage) => {
        const otherUserId = 
          lastMessage.senderId === userId 
            ? lastMessage.receiverId 
            : lastMessage.senderId;
        
        const otherUser = await this.usersService.findById(otherUserId);
        
        if (!otherUser) {
          return null;
        }
        
        // Count unread messages
        const unreadCount = await this.messagesRepository.count({
          where: {
            conversationId: lastMessage.conversationId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          conversationId: lastMessage.conversationId,
          otherUser: {
            id: otherUser.id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatar: otherUser.avatar,
          },
          lastMessage: {
            id: lastMessage.id,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          },
          unreadCount,
          updatedAt: lastMessage.createdAt,
        };
      })
    );

    // Filter out null values and sort by most recent
    return conversationList
      .filter((conv) => conv !== null)
      .sort(
        (a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  async getMessages(userId: string, otherUserId: string) {
    const conversationId = this.getConversationId(userId, otherUserId);

    // Verify the other user exists
    const otherUser = await this.usersService.findById(otherUserId);
    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    // Get all messages in this conversation
    const messages = await this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });

    // Mark messages as read if current user is the receiver
    const unreadMessages = messages.filter(
      (msg) => msg.receiverId === userId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((m) => m.id);
      await this.messagesRepository.update(
        { id: In(unreadIds) },
        { isRead: true }
      );

      // Update in memory
      unreadMessages.forEach((msg) => {
        msg.isRead = true;
      });
    }

    return {
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatar: otherUser.avatar,
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        type: msg.type || 'text',
        postId: msg.postId || null,
        fileUrl: msg.fileUrl || null,
        fileType: msg.fileType || null,
        fileSize: msg.fileSize || null,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        isRead: msg.isRead,
        deleted: msg.deleted || false,
        edited: msg.edited || false,
        editedAt: msg.editedAt || null,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender.id,
          username: msg.sender.username,
          displayName: msg.sender.displayName,
          avatar: msg.sender.avatar,
        },
      })),
    };
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('Cannot mark this message as read');
    }

    message.isRead = true;
    return this.messagesRepository.save(message);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messagesRepository.count({
      where: {
        receiverId: userId,
        isRead: false,
        deleted: false,
      },
    });
  }

  async update(messageId: string, userId: string, content: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.deleted) {
      throw new ForbiddenException('Cannot edit deleted message');
    }

    // Check if message is within 10 minutes
    const now = new Date();
    const messageAge = now.getTime() - message.createdAt.getTime();
    const tenMinutes = 10 * 60 * 1000;

    if (messageAge > tenMinutes) {
      throw new ForbiddenException('Message can only be edited within 10 minutes of sending');
    }

    message.content = content;
    message.edited = true;
    message.editedAt = now;

    return this.messagesRepository.save(message);
  }

  async delete(messageId: string, userId: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.fileUrl && (message.type === 'image' || message.type === 'video' || message.type === 'audio')) {
      await this.assetsService.removeByRelativePath(message.fileUrl);
    }

    message.deleted = true;
    message.content = 'This message was deleted';
    message.type = 'text';
    message.fileUrl = null;
    message.fileType = null;
    message.fileSize = null;

    return this.messagesRepository.save(message);
  }
}

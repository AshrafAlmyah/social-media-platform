import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.create(user.id, createMessageDto);
  }

  @Get('conversations')
  async getConversations(@CurrentUser() user: User) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('conversations/:userId')
  async getMessages(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getMessages(user.id, otherUserId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.messagesService.getUnreadCount(user.id);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') messageId: string, @CurrentUser() user: User) {
    return this.messagesService.markAsRead(messageId, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.update(messageId, user.id, updateMessageDto.content);
  }

  @Delete(':id')
  async delete(@Param('id') messageId: string, @CurrentUser() user: User) {
    return this.messagesService.delete(messageId, user.id);
  }
}



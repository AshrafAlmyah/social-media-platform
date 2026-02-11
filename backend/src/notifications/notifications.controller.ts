import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.getByUser(user.id, +page, +limit);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    const notification = await this.notificationsService.markAsRead(id, user.id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    const deleted = await this.notificationsService.delete(id, user.id);
    if (!deleted) {
      throw new NotFoundException('Notification not found');
    }
    return { success: true };
  }
}














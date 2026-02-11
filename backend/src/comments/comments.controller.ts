import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.create(postId, createCommentDto, user.id, createCommentDto.parentCommentId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user?: User,
  ) {
    return this.commentsService.findByPost(postId, user?.id, +page, +limit);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @CurrentUser() user?: User,
  ) {
    return this.commentsService.getReplies(commentId, user?.id, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/like')
  async like(@Param('commentId') commentId: string, @CurrentUser() user: User) {
    return this.commentsService.like(commentId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId/like')
  async unlike(@Param('commentId') commentId: string, @CurrentUser() user: User) {
    return this.commentsService.unlike(commentId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.delete(id, user.id);
  }
}

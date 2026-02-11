import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create(createPostDto, user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user?: User,
  ) {
    return this.postsService.findAll(user?.id, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getFeed(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.postsService.getFeed(user.id, +page, +limit);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('user/:username')
  async getUserPosts(
    @Param('username') username: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user?: User,
  ) {
    return this.postsService.getUserPosts(username, user?.id, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookmarks')
  async getBookmarks(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    try {
      return await this.postsService.getBookmarkedPosts(user.id, +page, +limit);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.postsService.findOne(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.update(id, user.id, updatePostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.delete(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async like(@Param('id') id: string, @CurrentUser() user: User) {
    console.log('Like request:', { postId: id, userId: user?.id });
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.postsService.like(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlike(@Param('id') id: string, @CurrentUser() user: User) {
    console.log('Unlike request:', { postId: id, userId: user?.id });
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.postsService.unlike(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/bookmark')
  async bookmark(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.bookmark(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/bookmark')
  async unbookmark(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.unbookmark(id, user.id);
  }
}


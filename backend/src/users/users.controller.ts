import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.usersService.searchUsers(query || '');
  }

  @Get(':username')
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() user?: User,
  ) {
    return this.usersService.getProfile(username, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/follow')
  async follow(@CurrentUser() user: User, @Param('username') username: string) {
    return this.usersService.follow(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':username/follow')
  async unfollow(@CurrentUser() user: User, @Param('username') username: string) {
    return this.usersService.unfollow(user.id, username);
  }

  @Get(':username/followers')
  async getFollowers(
    @Param('username') username: string,
    @CurrentUser() user?: User,
  ) {
    return this.usersService.getFollowers(username, user?.id);
  }

  @Get(':username/following')
  async getFollowing(
    @Param('username') username: string,
    @CurrentUser() user?: User,
  ) {
    return this.usersService.getFollowing(username, user?.id);
  }
}


















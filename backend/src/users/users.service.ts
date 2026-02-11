import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async getProfile(username: string, currentUserId?: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['followers', 'following'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const postsCount = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.posts', 'posts')
      .where('user.id = :id', { id: user.id })
      .select('COUNT(posts.id)', 'count')
      .getRawOne();

    const isFollowing = currentUserId
      ? user.followers.some((f) => f.id === currentUserId)
      : false;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.coverImage,
      createdAt: user.createdAt,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postsCount: parseInt(postsCount.count, 10),
      isFollowing,
    };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(userId, updateUserDto);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async follow(followerId: string, username: string) {
    const userToFollow = await this.usersRepository.findOne({
      where: { username },
      relations: ['followers'],
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    if (userToFollow.id === followerId) {
      throw new Error('Cannot follow yourself');
    }

    const isAlreadyFollowing = userToFollow.followers.some((f) => f.id === followerId);

    if (!isAlreadyFollowing) {
      const follower = await this.findById(followerId);
      if (follower) {
        userToFollow.followers.push(follower);
        await this.usersRepository.save(userToFollow);

        // Create follow notification
        await this.notificationsService.createFollowNotification(followerId, userToFollow.id);
      }
    }

    return { success: true, following: true };
  }

  async unfollow(followerId: string, username: string) {
    const userToUnfollow = await this.usersRepository.findOne({
      where: { username },
      relations: ['followers'],
    });

    if (!userToUnfollow) {
      throw new NotFoundException('User not found');
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (f) => f.id !== followerId,
    );
    await this.usersRepository.save(userToUnfollow);

    return { success: true, following: false };
  }

  async getFollowers(username: string, currentUserId?: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['followers', 'followers.followers'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.followers.map((f) => {
      const isFollowing = currentUserId
        ? f.followers?.some((follower) => follower.id === currentUserId) || false
        : false;
      return {
        id: f.id,
        username: f.username,
        displayName: f.displayName,
        avatar: f.avatar,
        isFollowing,
      };
    });
  }

  async getFollowing(username: string, currentUserId?: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['following', 'following.followers'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.following.map((f) => {
      const isFollowing = currentUserId
        ? f.followers?.some((follower) => follower.id === currentUserId) || false
        : false;
      return {
        id: f.id,
        username: f.username,
        displayName: f.displayName,
        avatar: f.avatar,
        isFollowing,
      };
    });
  }

  async searchUsers(query: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.displayName ILIKE :query', { query: `%${query}%` })
      .select(['user.id', 'user.username', 'user.displayName', 'user.avatar'])
      .limit(10)
      .getMany();
  }
}






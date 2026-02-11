import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      authorId,
    });
    const savedPost = await this.postsRepository.save(post);
    
    // Fetch the post with author details to return complete data
    const completePost = await this.postsRepository.findOne({
      where: { id: savedPost.id },
      relations: ['author'],
    });
    
    if (completePost) {
      completePost.likesCount = 0;
      completePost.commentsCount = 0;
      completePost.isLiked = false;
    }
    
    return completePost || savedPost;
  }

  async findAll(userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likedBy', 'likedBy')
      .leftJoin('post.comments', 'comments')
      .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
      .addSelect('COUNT(DISTINCT comments.id)', 'commentsCount')
      .groupBy('post.id')
      .addGroupBy('author.id')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const posts = await query.getRawAndEntities();

    // Check which posts the user has liked
    let likedPostIds = new Set<string>();
    const postIds = posts.entities.map((p) => p.id);
    
    // Only query for liked posts if userId is valid AND there are posts
    if (userId && userId.trim() !== '' && postIds.length > 0) {
      const likedPosts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.likedBy', 'user')
        .where('post.id IN (:...postIds)', { postIds })
        .andWhere('user.id = :userId', { userId })
        .select('post.id')
        .getMany();
      likedPostIds = new Set(likedPosts.map((p) => p.id));
    }

    // Check which posts the user has bookmarked
    let bookmarkedPostIds = new Set<string>();
    if (userId && userId.trim() !== '' && postIds.length > 0) {
      const bookmarkedPosts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.bookmarkedBy', 'user')
        .where('post.id IN (:...postIds)', { postIds })
        .andWhere('user.id = :userId', { userId })
        .select('post.id')
        .getMany();
      bookmarkedPostIds = new Set(bookmarkedPosts.map((p) => p.id));
    }

    return posts.entities.map((post, index) => ({
      ...post,
      likesCount: parseInt(posts.raw[index].likesCount, 10),
      commentsCount: parseInt(posts.raw[index].commentsCount, 10),
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
    }));
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      return [];
    }

    const skip = (page - 1) * limit;
    const followingIds = user.following.map((f) => f.id);
    
    // Always include own posts
    followingIds.push(userId);

    // Build query - only show posts from followed users (including self)
    let query = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likedBy', 'likedBy')
      .leftJoin('post.comments', 'comments')
      .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
      .addSelect('COUNT(DISTINCT comments.id)', 'commentsCount')
      .where('post.authorId IN (:...ids)', { ids: followingIds })
      .groupBy('post.id')
      .addGroupBy('author.id')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const posts = await query.getRawAndEntities();

    // Check which posts the user has liked
    let likedPostIds = new Set<string>();
    const postIds = posts.entities.map((p) => p.id);
    
    // Only query for liked posts if there are posts
    if (postIds.length > 0) {
      const likedPosts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.likedBy', 'user')
        .where('post.id IN (:...postIds)', { postIds })
        .andWhere('user.id = :userId', { userId })
        .select('post.id')
        .getMany();
      likedPostIds = new Set(likedPosts.map((p) => p.id));
    }

    // Check which posts the user has bookmarked
    let bookmarkedPostIds = new Set<string>();
    if (postIds.length > 0) {
      const bookmarkedPosts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.bookmarkedBy', 'user')
        .where('post.id IN (:...postIds)', { postIds })
        .andWhere('user.id = :userId', { userId })
        .select('post.id')
        .getMany();
      bookmarkedPostIds = new Set(bookmarkedPosts.map((p) => p.id));
    }

    return posts.entities.map((post, index) => ({
      ...post,
      likesCount: parseInt(posts.raw[index].likesCount, 10),
      commentsCount: parseInt(posts.raw[index].commentsCount, 10),
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
    }));
  }

  async getUserPosts(username: string, userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likedBy', 'likedBy')
      .leftJoin('post.comments', 'comments')
      .where('author.username = :username', { username })
      .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
      .addSelect('COUNT(DISTINCT comments.id)', 'commentsCount')
      .groupBy('post.id')
      .addGroupBy('author.id')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    // Check which posts the user has liked
    let likedPostIds = new Set<string>();
    const postIds = posts.entities.map((p) => p.id);
    
    // Only query for liked posts if userId is valid AND there are posts
    if (userId && userId.trim() !== '' && postIds.length > 0) {
      const likedPosts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.likedBy', 'user')
        .where('post.id IN (:...postIds)', { postIds })
        .andWhere('user.id = :userId', { userId })
        .select('post.id')
        .getMany();
      likedPostIds = new Set(likedPosts.map((p) => p.id));
    }

    // Check which posts the user has bookmarked
    let bookmarkedPostIds = new Set<string>();
    if (userId && userId.trim() !== '' && postIds.length > 0) {
      const bookmarkedPosts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.bookmarkedBy', 'user')
        .where('post.id IN (:...postIds)', { postIds })
        .andWhere('user.id = :userId', { userId })
        .select('post.id')
        .getMany();
      bookmarkedPostIds = new Set(bookmarkedPosts.map((p) => p.id));
    }

    return posts.entities.map((post, index) => ({
      ...post,
      likesCount: parseInt(posts.raw[index].likesCount, 10),
      commentsCount: parseInt(posts.raw[index].commentsCount, 10),
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
    }));
  }

  async findOne(id: string, userId?: string): Promise<Post> {
    const result = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.likedBy', 'likedBy')
      .leftJoin('post.comments', 'comments')
      .where('post.id = :id', { id })
      .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
      .addSelect('COUNT(DISTINCT comments.id)', 'commentsCount')
      .groupBy('post.id')
      .addGroupBy('author.id')
      .getRawAndEntities();

    if (!result.entities[0]) {
      throw new NotFoundException('Post not found');
    }

    const post = result.entities[0];
    post.likesCount = parseInt(result.raw[0].likesCount, 10);
    post.commentsCount = parseInt(result.raw[0].commentsCount, 10);
    post.isLiked = false;
    post.isBookmarked = false;

    // Only check if user has liked/bookmarked if userId is valid
    if (userId && userId.trim() !== '') {
      const liked = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.likedBy', 'user')
        .where('post.id = :id', { id })
        .andWhere('user.id = :userId', { userId })
        .getOne();
      post.isLiked = !!liked;

      const bookmarked = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.bookmarkedBy', 'user')
        .where('post.id = :id', { id })
        .andWhere('user.id = :userId', { userId })
        .getOne();
      post.isBookmarked = !!bookmarked;
    }

    return post;
  }

  async update(id: string, userId: string, updateData: { content?: string; image?: string }) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    // Update only provided fields
    if (updateData.content !== undefined) {
      post.content = updateData.content;
    }
    if (updateData.image !== undefined) {
      post.image = updateData.image ;
    }

    await this.postsRepository.save(post);

    // Return the updated post with all details
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsRepository.remove(post);
  }

  async like(postId: string, userId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['likedBy', 'author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAlreadyLiked = post.likedBy.some((u) => u.id === userId);

    if (!isAlreadyLiked) {
      post.likedBy.push(user);
      await this.postsRepository.save(post);

      // Create post like notification
      await this.notificationsService.createPostLikeNotification(
        userId,
        post.author.id,
        postId,
      );
    }

    // Get fresh count
    const updatedPost = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['likedBy'],
    });

    return { 
      success: true, 
      liked: true, 
      likesCount: updatedPost?.likedBy?.length || post.likedBy.length 
    };
  }

  async unlike(postId: string, userId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['likedBy'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const initialLength = post.likedBy.length;
    post.likedBy = post.likedBy.filter((u) => u.id !== userId);
    
    if (post.likedBy.length !== initialLength) {
      await this.postsRepository.save(post);
    }

    return { 
      success: true, 
      liked: false, 
      likesCount: post.likedBy.length 
    };
  }

  async bookmark(postId: string, userId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['bookmarkedBy'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAlreadyBookmarked = post.bookmarkedBy.some((u) => u.id === userId);

    if (!isAlreadyBookmarked) {
      post.bookmarkedBy.push(user);
      await this.postsRepository.save(post);
    }

    return { success: true, bookmarked: true };
  }

  async unbookmark(postId: string, userId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['bookmarkedBy'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.bookmarkedBy = post.bookmarkedBy.filter((u) => u.id !== userId);
    await this.postsRepository.save(post);

    return { success: true, bookmarked: false };
  }

  async getBookmarkedPosts(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Load user with bookmarkedPosts relation
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['bookmarkedPosts'],
      });

      if (!user) {
        return [];
      }

      // Handle case where bookmarkedPosts might be undefined or empty
      if (!user.bookmarkedPosts || user.bookmarkedPosts.length === 0) {
        return [];
      }

      const bookmarkedPostIds = user.bookmarkedPosts
        .map((p) => p?.id)
        .filter((id): id is string => id != null && id !== '');

      if (bookmarkedPostIds.length === 0) {
        return [];
      }

      // Query posts with full details, matching the structure of findAll/getFeed
      const posts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoin('post.likedBy', 'likedBy')
        .leftJoin('post.comments', 'comments')
        .where('post.id IN (:...ids)', { ids: bookmarkedPostIds })
        .addSelect('COUNT(DISTINCT likedBy.id)', 'likesCount')
        .addSelect('COUNT(DISTINCT comments.id)', 'commentsCount')
        .groupBy('post.id')
        .addGroupBy('author.id')
        .orderBy('post.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getRawAndEntities();

      // Check which posts the user has liked
      let likedPostIds = new Set<string>();
      const postIds = posts.entities.map((p) => p.id);
      
      if (postIds.length > 0) {
        const likedPosts = await this.postsRepository
          .createQueryBuilder('post')
          .leftJoin('post.likedBy', 'user')
          .where('post.id IN (:...postIds)', { postIds })
          .andWhere('user.id = :userId', { userId })
          .select('post.id')
          .getMany();
        likedPostIds = new Set(likedPosts.map((p) => p.id));
      }

      // Map results to match the Post interface format (same as findAll/getFeed)
      // getRawAndEntities() returns raw and entities in matching order
      if (!posts.entities || posts.entities.length === 0) {
        return [];
      }

      return posts.entities.map((post, index) => {
        const raw = posts.raw && posts.raw[index] ? posts.raw[index] : {};
        return {
          ...post,
          likesCount: parseInt(String(raw.likesCount || '0'), 10) || 0,
          commentsCount: parseInt(String(raw.commentsCount || '0'), 10) || 0,
          isLiked: likedPostIds.has(post.id),
          isBookmarked: true,
        };
      });
    } catch (error) {
      console.error('Error in getBookmarkedPosts:', error);
      throw error;
    }
  }
}


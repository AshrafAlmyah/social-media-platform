export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  createdAt?: string;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
}

export interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  postId: string;
  parentCommentId?: string;
  likesCount?: number;
  repliesCount?: number;
  isLiked?: boolean;
  replies?: Comment[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}






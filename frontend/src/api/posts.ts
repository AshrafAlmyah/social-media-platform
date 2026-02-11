import api from "./axios";
import { Post, Comment } from "../types";

export const postsApi = {
  create: async (data: { content: string; image?: string }): Promise<Post> => {
    const response = await api.post("/posts", data);
    return response.data;
  },

  getFeed: async (page = 1, limit = 20): Promise<Post[]> => {
    const response = await api.get("/posts/feed", { params: { page, limit } });
    return response.data;
  },

  getAll: async (page = 1, limit = 20): Promise<Post[]> => {
    const response = await api.get("/posts", { params: { page, limit } });
    return response.data;
  },

  getUserPosts: async (
    username: string,
    page = 1,
    limit = 20
  ): Promise<Post[]> => {
    const response = await api.get(`/posts/user/${username}`, {
      params: { page, limit },
    });
    return response.data;
  },

  getOne: async (id: string): Promise<Post> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: { content?: string; image?: string }
  ): Promise<Post> => {
    const response = await api.patch(`/posts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  like: async (id: string): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },

  unlike: async (
    id: string
  ): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await api.delete(`/posts/${id}/like`);
    return response.data;
  },

  getComments: async (
    postId: string,
    page = 1,
    limit = 20
  ): Promise<Comment[]> => {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  addComment: async (
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> => {
    const response = await api.post(`/posts/${postId}/comments`, {
      content,
      parentCommentId,
    });
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  },

  getReplies: async (
    postId: string,
    commentId: string,
    page = 1,
    limit = 10
  ): Promise<Comment[]> => {
    const response = await api.get(
      `/posts/${postId}/comments/${commentId}/replies`,
      { params: { page, limit } }
    );
    return response.data;
  },

  likeComment: async (
    postId: string,
    commentId: string
  ): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await api.post(
      `/posts/${postId}/comments/${commentId}/like`
    );
    return response.data;
  },

  unlikeComment: async (
    postId: string,
    commentId: string
  ): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await api.delete(
      `/posts/${postId}/comments/${commentId}/like`
    );
    return response.data;
  },

  bookmark: async (id: string): Promise<{ bookmarked: boolean }> => {
    const response = await api.post(`/posts/${id}/bookmark`);
    return response.data;
  },

  unbookmark: async (id: string): Promise<{ bookmarked: boolean }> => {
    const response = await api.delete(`/posts/${id}/bookmark`);
    return response.data;
  },

  getBookmarks: async (page = 1, limit = 20): Promise<Post[]> => {
    const response = await api.get('/posts/bookmarks', { params: { page, limit } });
    return response.data;
  },
};

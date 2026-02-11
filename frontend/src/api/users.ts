import api from './axios';
import { User, UserProfile } from '../types';

export const usersApi = {
  getProfile: async (username: string): Promise<UserProfile> => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
  }): Promise<User> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  follow: async (username: string): Promise<{ following: boolean }> => {
    const response = await api.post(`/users/${username}/follow`);
    return response.data;
  },

  unfollow: async (username: string): Promise<{ following: boolean }> => {
    const response = await api.delete(`/users/${username}/follow`);
    return response.data;
  },

  getFollowers: async (username: string): Promise<User[]> => {
    const response = await api.get(`/users/${username}/followers`);
    return response.data;
  },

  getFollowing: async (username: string): Promise<User[]> => {
    const response = await api.get(`/users/${username}/following`);
    return response.data;
  },

  search: async (query: string): Promise<User[]> => {
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  },
};


















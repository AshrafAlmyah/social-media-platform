import api from './axios';
import { AuthResponse, User } from '../types';

export const authApi = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { username: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};


















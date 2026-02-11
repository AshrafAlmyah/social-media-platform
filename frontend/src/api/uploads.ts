import api from './axios';

export const uploadsApi = {
  uploadImage: async (file: File): Promise<{ url: string; filename: string; fileType: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  uploadVideo: async (file: File): Promise<{ url: string; filename: string; fileType: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  uploadAudio: async (file: File): Promise<{ url: string; filename: string; fileType: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};


















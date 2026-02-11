import api from './axios';

export interface Conversation {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  type?: 'text' | 'post' | 'image' | 'video' | 'audio';
  postId?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  deleted?: boolean;
  edited?: boolean;
  editedAt?: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface ConversationWithMessages {
  otherUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  messages: Message[];
}

export const messagesApi = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Get messages in a conversation with a specific user
  getMessages: async (userId: string): Promise<ConversationWithMessages> => {
    const response = await api.get(`/messages/conversations/${userId}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (
    receiverId: string,
    content: string,
    type: 'text' | 'post' | 'image' | 'video' | 'audio' = 'text',
    postId?: string,
    fileUrl?: string,
    fileType?: string,
    fileSize?: number
  ): Promise<Message> => {
    const response = await api.post('/messages', {
      receiverId,
      content,
      type,
      postId,
      fileUrl,
      fileType,
      fileSize,
    });
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/messages/unread-count');
    return response.data.count;
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<void> => {
    await api.post(`/messages/${messageId}/read`);
  },

  // Update a message
  updateMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<Message> => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
};


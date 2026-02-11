import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { messagesApi, Conversation } from '../api/messages';
import { User } from '../types';

interface MessagesListProps {
  onSelectConversation: (userId: string) => void;
  selectedUserId: string | null;
}

export default function MessagesList({
  onSelectConversation,
  selectedUserId,
}: MessagesListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    // Poll for new conversations every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagesApi.getConversations();
      setConversations(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (user: Conversation['otherUser']) => {
    const name = user.displayName || user.username;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          No conversations yet
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Start a conversation by messaging someone!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <AnimatePresence>
        {conversations.map((conversation, index) => {
          const isSelected = selectedUserId === conversation.otherUser.id;
          return (
            <motion.div
              key={conversation.conversationId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectConversation(conversation.otherUser.id)}
              className={`p-4 cursor-pointer transition-all duration-200 border-b border-border-color ${
                isSelected ? 'bg-hover-bg-strong' : 'hover:bg-hover-bg'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--hover-bg-strong)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conversation.otherUser.avatar ? (
                    <img
                      src={conversation.otherUser.avatar}
                      alt={conversation.otherUser.displayName || conversation.otherUser.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--coral-text) 100%)',
                        color: 'white',
                      }}
                    >
                      {getInitials(conversation.otherUser)}
                    </div>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {conversation.otherUser.displayName || conversation.otherUser.username}
                    </p>
                    <span
                      className="text-xs flex-shrink-0 ml-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p
                    className="text-sm truncate"
                    style={{
                      color: conversation.unreadCount > 0
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                    }}
                  >
                    {conversation.lastMessage.senderId === conversation.otherUser.id
                      ? 'You: '
                      : ''}
                    {conversation.lastMessage.content}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}



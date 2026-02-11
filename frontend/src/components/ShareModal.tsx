import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search } from 'lucide-react';
import { messagesApi, Conversation } from '../api/messages';
import { usersApi } from '../api/users';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onShare: (receiverId: string) => Promise<void> | void;
  title?: string;
}

export default function ShareModal({ isOpen, onClose, postId, onShare, title = 'Share Post' }: ShareModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'following'>('conversations');
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conversationsData, followingData] = await Promise.all([
        messagesApi.getConversations(),
        currentUser ? usersApi.getFollowing(currentUser.username) : Promise.resolve([]),
      ]);
      setConversations(conversationsData);
      setFollowing(followingData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (receiverId: string) => {
    if (sharing) return;
    setSharing(receiverId);
    try {
      await onShare(receiverId);
      toast.success('Post shared');
      onClose();
    } catch (error) {
      toast.error('Failed to share post');
    } finally {
      setSharing(null);
    }
  };

  const getInitials = (user: { displayName?: string | null; username: string }) => {
    const name = user.displayName || user.username;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv) =>
    (conv.otherUser.displayName || conv.otherUser.username)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(
    (user) =>
      (user.displayName || user.username).toLowerCase().includes(searchQuery.toLowerCase()) &&
      user.id !== currentUser?.id
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card rounded-2xl overflow-hidden w-full max-w-md max-h-[80vh] flex flex-col"
          style={{ backgroundColor: 'var(--card-bg)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b border-border-color"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-hover-bg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border-color">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-color" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'conversations'
                  ? 'border-b-2'
                  : 'hover:bg-hover-bg'
              }`}
              style={{
                color: activeTab === 'conversations' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottomColor: activeTab === 'conversations' ? 'var(--accent)' : 'transparent',
              }}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'following'
                  ? 'border-b-2'
                  : 'hover:bg-hover-bg'
              }`}
              style={{
                color: activeTab === 'following' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottomColor: activeTab === 'following' ? 'var(--accent)' : 'transparent',
              }}
            >
              Following
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            ) : activeTab === 'conversations' ? (
              filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: 'var(--text-secondary)' }}>No conversations found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <motion.button
                      key={conversation.conversationId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleShare(conversation.otherUser.id)}
                      disabled={sharing === conversation.otherUser.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-hover-bg transition-all duration-200 disabled:opacity-50"
                    >
                      {conversation.otherUser.avatar ? (
                        <img
                          src={conversation.otherUser.avatar}
                          alt={conversation.otherUser.displayName || conversation.otherUser.username}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, var(--accent) 0%, var(--coral-text) 100%)',
                            color: 'white',
                          }}
                        >
                          {getInitials(conversation.otherUser)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {conversation.otherUser.displayName || conversation.otherUser.username}
                        </p>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          @{conversation.otherUser.username}
                        </p>
                      </div>
                      {sharing === conversation.otherUser.id && (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                      )}
                    </motion.button>
                  ))}
                </div>
              )
            ) : (
              filteredFollowing.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: 'var(--text-secondary)' }}>No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFollowing.map((user) => (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleShare(user.id)}
                      disabled={sharing === user.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-hover-bg transition-all duration-200 disabled:opacity-50"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName || user.username}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, var(--accent) 0%, var(--coral-text) 100%)',
                            color: 'white',
                          }}
                        >
                          {getInitials(user)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {user.displayName || user.username}
                        </p>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          @{user.username}
                        </p>
                      </div>
                      {sharing === user.id && (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                      )}
                    </motion.button>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


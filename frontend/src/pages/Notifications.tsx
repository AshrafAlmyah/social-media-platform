import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi, Notification } from '../api/notifications';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const { notifications: data, totalPages } = await notificationsApi.getAll(pageNum, 20);
      if (pageNum === 1) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-accent-400" />;
      case 'post_like':
      case 'comment_like':
        return <Heart className="w-5 h-5 text-coral-400 fill-current" />;
      case 'post_comment':
      case 'comment_reply':
        return <MessageCircle className="w-5 h-5 text-mint-400" />;
      default:
        return <Bell className="w-5 h-5 text-dark-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actor = notification.actor.displayName || notification.actor.username;
    switch (notification.type) {
      case 'follow':
        return <><strong className="text-white">{actor}</strong> started following you</>;
      case 'post_like':
        return <><strong className="text-white">{actor}</strong> liked your post</>;
      case 'post_comment':
        return <><strong className="text-white">{actor}</strong> commented on your post</>;
      case 'comment_like':
        return <><strong className="text-white">{actor}</strong> liked your comment</>;
      case 'comment_reply':
        return <><strong className="text-white">{actor}</strong> replied to your comment</>;
      default:
        return <><strong className="text-white">{actor}</strong> interacted with you</>;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'follow') {
      return `/${notification.actor.username}`;
    }
    if (notification.post) {
      return `/post/${notification.post.id}`;
    }
    return '#';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-coral-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-dark-400">{unreadCount} unread</p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-accent-400 font-medium transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </motion.div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading && notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
            </motion.div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 glass-card rounded-2xl"
            >
              <Bell className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No notifications</h2>
              <p className="text-dark-400">When someone interacts with you, you'll see it here</p>
            </motion.div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
                className={`glass-card rounded-2xl overflow-hidden group relative ${
                  !notification.isRead ? 'ring-1 ring-accent-500/30' : ''
                }`}
              >
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => {
                    if (!notification.isRead) handleMarkAsRead(notification.id);
                  }}
                  className={`flex items-start gap-4 p-4 hover:bg-white/5 transition-colors ${
                    !notification.isRead ? 'bg-accent-500/5' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Actor Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden -ml-6 border-2 border-dark-900">
                    {notification.actor.avatar ? (
                      <img
                        src={notification.actor.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      notification.actor.displayName?.[0] || notification.actor.username[0]
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 leading-relaxed">
                      {getNotificationText(notification)}
                    </p>
                    {notification.post && notification.type !== 'follow' && (
                      <p className="text-sm text-dark-400 mt-1 line-clamp-2">
                        "{notification.post.content}"
                      </p>
                    )}
                    <p className="text-xs text-dark-500 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="w-3 h-3 rounded-full bg-accent-500 flex-shrink-0 mt-2 animate-pulse" />
                  )}
                </Link>

                {/* Delete button (shows on hover) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(notification.id);
                  }}
                  className="absolute top-4 right-4 p-2 text-dark-500 hover:text-coral-400 hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => fetchNotifications(page + 1)}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </motion.div>
      )}
    </div>
  );
}


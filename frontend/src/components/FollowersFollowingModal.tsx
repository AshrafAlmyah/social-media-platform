import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usersApi } from '../api/users';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

export default function FollowersFollowingModal({
  isOpen,
  onClose,
  username,
  type,
}: FollowersFollowingModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<{ [key: string]: boolean }>({});
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (isOpen && username) {
      loadUsers();
    }
  }, [isOpen, username, type]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data =
        type === 'followers'
          ? await usersApi.getFollowers(username)
          : await usersApi.getFollowing(username);
      setUsers(data);
    } catch (error) {
      toast.error(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUsername: string, isFollowing: boolean) => {
    if (followLoading[targetUsername]) return;
    setFollowLoading((prev) => ({ ...prev, [targetUsername]: true }));

    try {
      if (isFollowing) {
        await usersApi.unfollow(targetUsername);
        toast.success('Unfollowed');
      } else {
        await usersApi.follow(targetUsername);
        toast.success('Following');
      }
      // Reload the list to update follow status
      loadUsers();
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  const getInitials = (user: User) => {
    const name = user.displayName || user.username;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
              {type === 'followers' ? 'Followers' : 'Following'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-hover-bg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: 'var(--text-secondary)' }}>
                  No {type === 'followers' ? 'followers' : 'following'} yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const isOwnProfile = currentUser?.username === user.username;
                  const isFollowing = (user as any).isFollowing || false;

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-hover-bg transition-colors"
                    >
                      <Link
                        to={`/${user.username}`}
                        onClick={onClose}
                        className="flex items-center gap-3 flex-1 min-w-0"
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
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {user.displayName || user.username}
                          </p>
                          <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                            @{user.username}
                          </p>
                        </div>
                      </Link>
                      {!isOwnProfile && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFollow(user.username, isFollowing);
                          }}
                          disabled={followLoading[user.username]}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 flex-shrink-0 ${
                            isFollowing
                              ? 'bg-white/5 hover:bg-coral-500/20 text-white hover:text-coral-400'
                              : 'btn-primary text-white'
                          }`}
                        >
                          {followLoading[user.username] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isFollowing ? (
                            <>
                              <UserMinus className="w-4 h-4" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}



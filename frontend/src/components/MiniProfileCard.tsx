import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { usersApi } from '../api/users';
import { UserProfile } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface MiniProfileCardProps {
  username: string;
  children: React.ReactNode;
}

export default function MiniProfileCard({ username, children }: MiniProfileCardProps) {
  const [showCard, setShowCard] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (showCard && !profile) {
      setIsLoading(true);
      usersApi
        .getProfile(username)
        .then((data) => {
          setProfile(data);
        })
        .catch(() => {
          // Silently fail - don't show error for hover
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [showCard, username, profile]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowCard(true);
    }, 500); // 500ms delay
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowCard(false);
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await usersApi.unfollow(username);
        setProfile((prev) =>
          prev ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 } : null
        );
        toast.success('Unfollowed');
      } else {
        await usersApi.follow(username);
        setProfile((prev) =>
          prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null
        );
        toast.success('Following');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Close card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowCard(false);
      }
    };
    if (showCard) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCard]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {showCard && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.4, 0, 0.2, 1],
              scale: { duration: 0.2 },
            }}
            className="absolute left-0 top-full mt-2 w-72 glass-card rounded-2xl p-4 z-50 shadow-2xl border border-white/5"
            onMouseEnter={() => setShowCard(true)}
            onMouseLeave={() => setShowCard(false)}
            style={{
              backdropFilter: 'blur(20px)',
            }}
          >
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-8"
              >
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                >
                  <Loader2 className="w-6 h-6 text-accent-400" />
                </motion.div>
              </motion.div>
            ) : profile ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, staggerChildren: 0.05 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/${profile.username}`}
                    className="flex items-center gap-3 mb-4 group"
                    onClick={() => setShowCard(false)}
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden avatar-hover ring-2 ring-white/10"
                    >
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        profile.displayName?.[0] || profile.username[0]
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate group-hover:text-accent-400 transition-colors">
                        {profile.displayName || profile.username}
                      </p>
                      <p className="text-sm text-dark-400 truncate">@{profile.username}</p>
                    </div>
                  </Link>
                </motion.div>

                {profile.bio && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="text-sm text-white/80 mb-4 line-clamp-2"
                    style={{ color: 'var(--text-opacity-80)' }}
                  >
                    {profile.bio}
                  </motion.p>
                )}

                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex items-center gap-4 mb-4 text-sm"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="cursor-default"
                  >
                    <span className="font-bold text-white">{profile.followingCount}</span>
                    <span className="text-dark-400 ml-1">Following</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="cursor-default"
                  >
                    <span className="font-bold text-white">{profile.followersCount}</span>
                    <span className="text-dark-400 ml-1">Followers</span>
                  </motion.div>
                </motion.div>

                {!isOwnProfile && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 interactive-btn ${
                      profile.isFollowing
                        ? 'bg-white/5 hover:bg-coral-500/20 text-white hover:text-coral-400'
                        : 'btn-primary text-white'
                    } disabled:opacity-50`}
                  >
                    {isFollowLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    ) : profile.isFollowing ? (
                      <>
                        <motion.div
                          whileHover={{ rotate: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <UserMinus className="w-4 h-4" />
                        </motion.div>
                        Unfollow
                      </>
                    ) : (
                      <>
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <UserPlus className="w-4 h-4" />
                        </motion.div>
                        Follow
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4 text-dark-400 text-sm"
              >
                Failed to load profile
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


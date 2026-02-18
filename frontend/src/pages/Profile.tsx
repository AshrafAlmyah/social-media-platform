import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, UserPlus, UserMinus, Edit2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { usersApi } from '../api/users';
import { postsApi } from '../api/posts';
import { UserProfile, Post } from '../types';
import { useAuthStore } from '../store/authStore';
import PostCard from '../components/PostCard';
import EditProfileModal from '../components/EditProfileModal';
import FollowersFollowingModal from '../components/FollowersFollowingModal';
import toast from 'react-hot-toast';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;
      setIsLoading(true);
      try {
        const [profileData, postsData] = await Promise.all([
          usersApi.getProfile(username),
          postsApi.getUserPosts(username),
        ]);
        setProfile(profileData);
        setPosts(postsData);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const handleFollow = async () => {
    if (!profile || !username) return;
    setIsFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await usersApi.unfollow(username);
        setProfile((prev) =>
          prev ? { ...prev, isFollowing: false, followersCount: prev.followersCount - 1 } : null
        );
      } else {
        await usersApi.follow(username);
        setProfile((prev) =>
          prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null
        );
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile || !currentUser || isOwnProfile) return;
    setIsMessageLoading(true);
    try {
      // Navigate to messages page with userId query param
      // The Messages page will handle loading/creating the conversation
      // This matches exactly how MessagesList opens conversations
      navigate(`/messages?userId=${profile.id}`);
    } catch (error) {
      toast.error('Failed to open conversation');
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleProfileUpdated = (updatedProfile: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="type-h2 text-white mb-2">User not found</h2>
        <p className="text-dark-400">This user doesn't exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {/* Cover */}
        <div className="h-44 relative" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          {profile.coverImage && (
            <img
              src={profile.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 md:px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6 gap-4">
            {/* Profile Picture - positioned above cover */}
            <div className="relative z-10 w-28 h-28 rounded-full border-4 flex items-center justify-center text-white font-semibold text-3xl overflow-hidden avatar-hover" style={{ backgroundColor: "var(--accent)", borderColor: "var(--bg-secondary)" }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.displayName?.[0] || profile.username[0]
              )}
            </div>

            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 interactive-btn"
              >
                <Edit2 className="w-4 h-4 icon-bounce" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all duration-200 interactive-btn ${
                    profile.isFollowing
                      ? 'bg-white/5 hover:bg-coral-500/20 text-white hover:text-coral-400 hover:shadow-lg hover:shadow-coral-500/20'
                      : 'btn-primary text-white'
                  }`}
                >
                  {isFollowLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : profile.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 icon-bounce" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 icon-bounce" />
                      Follow
                    </>
                  )}
                </button>
                <button
                  onClick={handleMessage}
                  disabled={isMessageLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 interactive-btn"
                >
                  {isMessageLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 icon-bounce" />
                      Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <h1 className="type-h1 text-white mb-1">
            {profile.displayName || profile.username}
          </h1>
          <p className="type-meta text-dark-400 mb-4">@{profile.username}</p>

          {profile.bio && (
            <p className="type-body text-white/80 mb-5 max-w-2xl">{profile.bio}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-dark-400 mb-6">
            <Calendar className="w-4 h-4" />
            Joined {format(new Date(profile.createdAt || new Date()), 'MMMM yyyy')}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 rounded-xl soft-divider border" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <div className="text-center py-2">
              <span className="block text-xl font-medium text-white">{profile.postsCount}</span>
              <span className="type-meta text-dark-400">Posts</span>
            </div>
            <button
              onClick={() => setShowFollowersModal(true)}
              className="text-center cursor-pointer hover:opacity-80 transition-opacity py-2"
            >
              <span className="block text-xl font-medium text-white">{profile.followersCount}</span>
              <span className="type-meta text-dark-400">Followers</span>
            </button>
            <button
              onClick={() => setShowFollowingModal(true)}
              className="text-center cursor-pointer hover:opacity-80 transition-opacity py-2"
            >
              <span className="block text-xl font-medium text-white">{profile.followingCount}</span>
              <span className="type-meta text-dark-400">Following</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      <h2 className="type-h2">Posts</h2>
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
          ))}
        </AnimatePresence>
      </div>

      {posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 glass-card rounded-2xl"
        >
          <div className="text-4xl mb-3">📝</div>
          <p className="text-dark-400">
            {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
          </p>
        </motion.div>
      )}

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileUpdated}
        />
      )}

      {showFollowersModal && username && (
        <FollowersFollowingModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          username={username}
          type="followers"
        />
      )}

      {showFollowingModal && username && (
        <FollowersFollowingModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          username={username}
          type="following"
        />
      )}
    </div>
  );
}

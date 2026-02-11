import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { postsApi } from '../api/posts';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import toast from 'react-hot-toast';

export default function Bookmarks() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBookmarks = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const data = await postsApi.getBookmarks(pageNum, 20);
      if (pageNum === 1) {
        setPosts(data || []);
      } else {
        setPosts((prev) => [...prev, ...(data || [])]);
      }
      setHasMore((data || []).length === 20);
    } catch (error: any) {
      console.error('Failed to load bookmarks:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      toast.error(error?.response?.data?.message || 'Failed to load bookmarks');
      // Set empty array on error to show empty state
      if (pageNum === 1) {
        setPosts([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks(1);
  }, []);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBookmarks(nextPage);
  };

  if (isLoading) {
    return (
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6"
        >
          <span className="gradient-text">Bookmarks</span>
        </motion.h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <PostSkeleton key={i} index={i - 1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
      >
        <span className="gradient-text">Bookmarks</span>
      </motion.h1>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1],
              }}
              layout
            >
              <PostCard post={post} onDelete={handlePostDeleted} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-center py-20 glass-card rounded-2xl"
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Bookmark className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-white mb-2"
          >
            No bookmarks yet
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-dark-400 text-sm"
          >
            Bookmark posts to find them easily later
          </motion.p>
        </motion.div>
      )}

      {hasMore && posts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-8"
        >
          <motion.button
            onClick={loadMore}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 interactive-btn hover:shadow-lg border border-white/5"
          >
            Load More
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}


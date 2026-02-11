import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postsApi } from '../api/posts';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import CreatePost from '../components/CreatePost';
import toast from 'react-hot-toast';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum: number) => {
    try {
      const data = await postsApi.getFeed(pageNum);
      if (pageNum === 1) {
        setPosts(data);
      } else {
        setPosts((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  if (isLoading) {
    return (
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6"
        >
          Your <span className="gradient-text">Feed</span>
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
        Your <span className="gradient-text">Feed</span>
      </motion.h1>

      <CreatePost onPostCreated={handlePostCreated} />

      <div className="space-y-4">
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
          ))}
        </AnimatePresence>
      </div>

      {posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 glass-card rounded-2xl"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-white mb-2">Your feed is empty</h3>
          <p className="text-dark-400 text-sm">
            Follow users to see their posts here
          </p>
        </motion.div>
      )}

      {hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 interactive-btn hover:shadow-lg"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

















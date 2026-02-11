import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { postsApi } from "../api/posts";
import { usersApi } from "../api/users";
import { Post, User } from "../types";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import toast from "react-hot-toast";

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsApi.getAll(1, 20);
        setPosts(data);
      } catch (error) {
        toast.error("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await usersApi.search(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (isLoading) {
    return (
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6"
        >
          <span className="gradient-text">Explore</span>
        </motion.h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        <span className="gradient-text">Explore</span>
      </motion.h1>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-dark-800/50 border border-white/5 text-white placeholder-dark-500 focus:border-accent-500 focus-glow input-smooth"
          />
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {(searchResults.length > 0 || isSearching) && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl overflow-hidden z-10"
            >
              {isSearching ? (
                <div className="p-4 text-center text-dark-400">
                  Searching...
                </div>
              ) : (
                searchResults.map((user) => (
                  <Link
                    key={user.id}
                    to={`/${user.username}`}
                    className="flex items-center gap-3 p-4 hover:bg-white/8 transition-all duration-200 interactive-link hover-scale"
                    onClick={() => setSearchQuery("")}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex items-center justify-center text-white font-bold avatar-hover">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.displayName?.[0] || user.username[0]
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-sm text-dark-400">@{user.username}</p>
                    </div>
                  </Link>
                ))
              )}
              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="p-4 text-center text-dark-400">
                  No users found
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* All Posts */}
      <h2 className="text-xl font-semibold mb-4 text-dark-200">Recent Posts</h2>
      <div className="space-y-4">
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
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No posts to explore
          </h3>
          <p className="text-dark-400">Be the first to post something!</p>
        </motion.div>
      )}
    </div>
  );
}

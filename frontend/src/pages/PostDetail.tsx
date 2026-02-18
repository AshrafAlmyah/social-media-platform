import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Send, Trash2, Reply, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { postsApi } from '../api/posts';
import { Post, Comment } from '../types';
import { useAuthStore } from '../store/authStore';
import ImageModal from '../components/ImageModal';
import MiniProfileCard from '../components/MiniProfileCard';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ShareModal from '../components/ShareModal';
import { messagesApi } from '../api/messages';
import toast from 'react-hot-toast';

interface CommentWithReplies extends Comment {
  replies?: Comment[];
  showReplies?: boolean;
  loadingReplies?: boolean;
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPostImageLoaded, setIsPostImageLoaded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    commentId: string;
    isReply: boolean;
    parentId?: string;
  } | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;
      try {
        const [postData, commentsData] = await Promise.all([
          postsApi.getOne(postId),
          postsApi.getComments(postId),
        ]);
        setPost(postData);
        setComments(commentsData.map(c => ({ ...c, replies: [], showReplies: false })));
      } catch (error) {
        toast.error('Failed to load post');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, navigate]);

  useEffect(() => {
    setIsPostImageLoaded(false);
  }, [post?.image]);

  // Focus reply input when replying to a comment
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const handleLike = async () => {
    if (!post || isLiking) return;
    
    const wasLiked = post.isLiked;
    const previousCount = post.likesCount || 0;
    
    setPost({
      ...post,
      isLiked: !wasLiked,
      likesCount: wasLiked ? previousCount - 1 : previousCount + 1,
    });
    setIsLiking(true);
    
    if (!wasLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 450);
    }
    
    try {
      if (wasLiked) {
        const result = await postsApi.unlike(post.id);
        setPost((prev) => prev ? { ...prev, likesCount: result.likesCount } : null);
      } else {
        const result = await postsApi.like(post.id);
        setPost((prev) => prev ? { ...prev, likesCount: result.likesCount } : null);
      }
    } catch (error) {
      setPost((prev) => prev ? { ...prev, isLiked: wasLiked, likesCount: previousCount } : null);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await postsApi.addComment(postId, newComment.trim());
      
      const completeComment: CommentWithReplies = {
        ...comment,
        author: comment.author || {
          id: user?.id || '',
          username: user?.username || '',
          displayName: user?.displayName,
          avatar: user?.avatar,
        },
        replies: [],
        showReplies: false,
        repliesCount: 0,
      };
      
      setComments((prev) => [completeComment, ...prev]);
      setNewComment('');
      if (post) {
        setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      }
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !replyingTo || !replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      const reply = await postsApi.addComment(postId, replyContent.trim(), replyingTo.id);
      
      const completeReply: Comment = {
        ...reply,
        author: reply.author || {
          id: user?.id || '',
          username: user?.username || '',
          displayName: user?.displayName,
          avatar: user?.avatar,
        },
      };
      
      // Add reply to the parent comment
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyingTo.id
            ? {
                ...c,
                replies: [...(c.replies || []), completeReply],
                repliesCount: (c.repliesCount || 0) + 1,
                showReplies: true,
              }
            : c
        )
      );
      
      setReplyContent('');
      setReplyingTo(null);
      if (post) {
        setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      }
      toast.success('Reply added!');
    } catch (error) {
      toast.error('Failed to add reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    if (!postId) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Toggle if already loaded
    if (comment.replies && comment.replies.length > 0) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, showReplies: !c.showReplies } : c
        )
      );
      return;
    }

    // Load replies
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, loadingReplies: true } : c
      )
    );

    try {
      const replies = await postsApi.getReplies(postId, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, replies, showReplies: true, loadingReplies: false }
            : c
        )
      );
    } catch (error) {
      toast.error('Failed to load replies');
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, loadingReplies: false } : c
        )
      );
    }
  };

  const handleRequestDeleteComment = (commentId: string, isReply = false, parentId?: string) => {
    setDeleteTarget({ commentId, isReply, parentId });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!postId || !deleteTarget || isDeletingComment) return;
    setIsDeletingComment(true);
    try {
      await postsApi.deleteComment(postId, deleteTarget.commentId);

      if (deleteTarget.isReply && deleteTarget.parentId) {
        // Remove reply from parent comment
        setComments((prev) =>
          prev.map((c) =>
            c.id === deleteTarget.parentId
              ? {
                  ...c,
                  replies: c.replies?.filter((r) => r.id !== deleteTarget.commentId),
                  repliesCount: Math.max(0, (c.repliesCount || 0) - 1),
                }
              : c
          )
        );
      } else {
        // Remove top-level comment
        setComments((prev) => prev.filter((c) => c.id !== deleteTarget.commentId));
      }

      if (post) {
        setPost({ ...post, commentsCount: Math.max(0, post.commentsCount - 1) });
      }
      toast.success('Comment deleted');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Failed to delete comment');
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.author.username });
    setReplyContent(`@${comment.author.username} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="type-h2 text-white mb-2">Post not found</h2>
        <p className="text-dark-400">This post doesn't exist or has been deleted.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-all duration-200 interactive-btn hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5 icon-bounce" />
        Back
      </button>

      {/* Post */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-4 mb-4">
          <MiniProfileCard username={post.author.username}>
            <Link to={`/${post.author.username}`} className="interactive-link">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden avatar-hover" style={{ backgroundColor: "var(--accent)" }}>
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  post.author.displayName?.[0] || post.author.username[0]
                )}
              </div>
            </Link>
          </MiniProfileCard>
          <div>
            <MiniProfileCard username={post.author.username}>
              <Link
                to={`/${post.author.username}`}
                className="font-semibold text-white hover:text-accent-400 transition-all duration-200 interactive-link hover-scale link-underline"
              >
                {post.author.displayName || post.author.username}
              </Link>
            </MiniProfileCard>
            <p className="type-meta text-dark-400">
              @{post.author.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <p className="type-post-title text-white/90 whitespace-pre-wrap mb-6">{post.content}</p>

        {post.image && (
          <div className="relative w-full rounded-xl mb-4 overflow-hidden">
            {!isPostImageLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
            )}
            <img
              src={post.image}
              alt=""
              onLoad={() => setIsPostImageLoaded(true)}
              onClick={() => setIsImageModalOpen(true)}
              className={`w-full object-cover max-h-[500px] cursor-pointer media-fade-image ${
                isPostImageLoaded ? 'is-loaded' : ''
              }`}
              style={{ borderRadius: "10px" }}
            />
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          {/* Like Button */}
          <motion.button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={`group reaction-btn relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold cursor-pointer select-none text-sm
              transition-all duration-200 overflow-visible interactive-btn
              ${post.isLiked 
                ? 'bg-coral-500/20 text-coral-400 hover:bg-coral-500/30 hover:shadow-lg hover:shadow-coral-500/20' 
                : 'bg-white/5 text-dark-300 hover:bg-white/10 hover:text-coral-400 hover:shadow-lg hover:shadow-coral-500/20'
              } 
              disabled:opacity-50 
              active:scale-95`}
            style={{
              color: post.isLiked ? 'var(--coral-text)' : undefined,
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {isAnimating && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
                <motion.span
                  className="reaction-ripple"
                  initial={{ scale: 0.5, opacity: 0.6 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
                <motion.span
                  className="reaction-particle reaction-particle-1"
                  initial={{ opacity: 0.85, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: -6, y: -12 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
                <motion.span
                  className="reaction-particle reaction-particle-2"
                  initial={{ opacity: 0.85, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: 8, y: -8 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
                <motion.span
                  className="reaction-particle reaction-particle-3"
                  initial={{ opacity: 0.85, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </span>
            )}
            <motion.span
              className="relative z-10"
              animate={
                isAnimating
                  ? {
                      filter: [
                        'drop-shadow(0 0 0 rgba(224,122,95,0))',
                        'drop-shadow(0 0 6px rgba(224,122,95,0.5))',
                        'drop-shadow(0 0 0 rgba(224,122,95,0))',
                      ],
                    }
                  : { filter: 'drop-shadow(0 0 0 rgba(224,122,95,0))' }
              }
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Heart
                className={`w-5 h-5 reaction-icon ${
                  post.isLiked ? 'fill-current' : ''
                } ${post.isLiked ? '' : 'text-dark-300 group-hover:text-coral-400'} transition-all duration-200 ease-out`}
                style={{
                  color: post.isLiked ? 'var(--coral-text)' : undefined,
                }}
              />
            </motion.span>
            <span className="tabular-nums">{post.likesCount || 0} Likes</span>
          </motion.button>

          {/* Comments Count */}
          <button
            type="button"
            onClick={() => document.getElementById('comment-input')?.focus()}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-dark-300 font-semibold text-sm
              hover:bg-accent-500/20 hover:text-accent-400 
              hover:shadow-lg hover:shadow-accent-500/20
              transition-all duration-200 ease-out cursor-pointer interactive-btn
              active:scale-95 active:bg-accent-500/30"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            <span className="absolute inset-0 rounded-full bg-accent-500/0 group-hover:bg-accent-500/10 transition-all duration-150" />
            <MessageCircle 
              className="w-5 h-5 relative z-10 transition-all duration-150 ease-out
                group-hover:scale-125 group-hover:rotate-[-12deg] group-hover:text-accent-400
                group-active:scale-90 group-active:rotate-0" 
              style={{
                color: 'var(--text-secondary)',
              }}
            />
            <span className="tabular-nums relative z-10 transition-all duration-150 
              group-hover:translate-x-0.5 group-hover:text-accent-400"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              {post.commentsCount || 0} Comments
            </span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-dark-300 font-semibold text-sm
              hover:bg-mint-500/20 hover:text-mint-400 
              hover:shadow-lg hover:shadow-mint-500/20
              transition-all duration-200 ease-out cursor-pointer interactive-btn share-btn-colored
              active:scale-95"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            <span className="absolute inset-0 rounded-full bg-mint-500/0 group-hover:bg-mint-500/10 transition-all duration-150" />
            <Share2
              className="w-5 h-5 relative z-10 transition-all duration-150 ease-out
                group-hover:scale-125 group-hover:rotate-12 group-hover:text-mint-400
                group-active:scale-90 group-active:rotate-0"
              style={{
                color: 'var(--text-secondary)',
              }}
            />
            <span className="text-sm font-medium relative z-10">Share</span>
          </button>
        </div>
      </motion.article>

      {/* Comment form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmitComment}
        className="glass-card rounded-xl p-5 mb-6 border soft-divider hover:border-accent-500/30 transition-all duration-200"
      >
        <div className="flex gap-4 items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold overflow-hidden avatar-hover"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.[0] || user?.username?.[0] || 'U'
            )}
          </motion.div>
          <div className="flex-1 relative">
            <input
              id="comment-input"
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full text-white placeholder-dark-400 border border-white/5 rounded-lg px-4 py-3 focus:outline-none focus:border-accent-500/50 transition-all duration-200 input-smooth focus-glow"
              style={{ backgroundColor: "#FAF9F6" }}
              maxLength={300}
            />
            {newComment.length > 0 && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  newComment.length > 250 ? 'text-coral-400' : 'text-dark-500'
                }`}
              >
                {newComment.length}/300
              </motion.span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className={`group p-3 rounded-xl transition-all duration-200 interactive-btn
              ${newComment.trim() 
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40' 
                : 'bg-dark-700 text-dark-500 cursor-not-allowed'
              } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 transition-transform duration-100 group-hover:scale-110 group-hover:translate-x-0.5 group-active:scale-90" />
            )}
          </button>
        </div>
      </motion.form>

      {/* Reply form (shows when replying) */}
      <AnimatePresence>
        {replyingTo && (
          <motion.form
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            onSubmit={handleSubmitReply}
            className="glass-card rounded-2xl p-4 mb-6 border border-accent-500/30 bg-accent-500/5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Reply className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-accent-400">
                Replying to <strong>@{replyingTo.username}</strong>
              </span>
              <button
                type="button"
                onClick={cancelReply}
                className="ml-auto text-xs text-dark-400 hover:text-white transition-all duration-200 interactive-btn hover:scale-105"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.[0] || user?.username?.[0] || 'U'
                )}
              </div>
              <input
                ref={replyInputRef}
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="flex-1 text-white placeholder-dark-400 border border-white/5 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-500/50 transition-all duration-200 input-smooth focus-glow"
                style={{ backgroundColor: "#FAF9F6" }}
                maxLength={300}
              />
              <button
                type="submit"
                disabled={isSubmittingReply || !replyContent.trim()}
                className={`p-2.5 rounded-xl transition-all duration-200 interactive-btn
                  ${replyContent.trim() 
                    ? 'bg-accent-500 text-white hover:bg-accent-600 hover:shadow-lg hover:shadow-accent-500/30' 
                    : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  } disabled:opacity-50`}
              >
                {isSubmittingReply ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Comments Header */}
      {comments.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-4"
        >
          <MessageCircle className="w-5 h-5 text-accent-400" />
          <h3 className="type-h3 text-white">Comments</h3>
          <span className="px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 text-sm font-medium">
            {comments.length}
          </span>
        </motion.div>
      )}

      {/* Comments List */}
      <div className="space-y-5 ml-3 sm:ml-6">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.18,
                ease: 'easeOut',
                delay: index * 0.02,
              }}
              className="glass-card rounded-xl overflow-hidden"
            >
              {/* Main Comment */}
              <div className="p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <MiniProfileCard username={comment.author.username}>
                      <Link to={`/${comment.author.username}`} className="interactive-link">
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 overflow-hidden avatar-hover"
                          style={{ backgroundColor: "var(--accent)" }}
                        >
                          {comment.author.avatar ? (
                            <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            comment.author.displayName?.[0] || comment.author.username[0]
                          )}
                        </motion.div>
                      </Link>
                    </MiniProfileCard>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MiniProfileCard username={comment.author.username}>
                          <Link
                            to={`/${comment.author.username}`}
                            className="font-semibold text-white hover:text-accent-400 transition-all duration-200 interactive-link hover-scale link-underline"
                          >
                            {comment.author.displayName || comment.author.username}
                          </Link>
                        </MiniProfileCard>
                        <span className="type-meta text-dark-500 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-dark-500"></span>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-white/85 mt-2 leading-relaxed break-words">
                        {comment.content}
                      </p>
                      
                      {/* Comment Actions */}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => handleReply(comment)}
                          className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-accent-400 transition-all duration-200 interactive-btn group/reply hover:scale-105"
                        >
                          <Reply className="w-3.5 h-3.5 group-hover/reply:scale-110 icon-bounce transition-transform" />
                          Reply
                        </button>
                        
                        {(comment.repliesCount || 0) > 0 && (
                          <button
                            onClick={() => handleLoadReplies(comment.id)}
                            className="flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 transition-all duration-200 interactive-btn hover:scale-105"
                          >
                            {comment.loadingReplies ? (
                              <div className="w-3 h-3 border border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
                            ) : comment.showReplies ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                            {comment.showReplies ? 'Hide' : 'View'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {user?.id === comment.author.id && (
                    <motion.button
                      onClick={() => handleRequestDeleteComment(comment.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-dark-500 hover:text-coral-400 hover:bg-coral-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Replies */}
              <AnimatePresence>
                {comment.showReplies && comment.replies && comment.replies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t soft-divider"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-4 pl-12 group/reply border-b soft-divider last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 flex-1 min-w-0">
                            <MiniProfileCard username={reply.author.username}>
                              <Link to={`/${reply.author.username}`} className="interactive-link">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0 overflow-hidden avatar-hover" style={{ backgroundColor: "var(--accent)" }}>
                                  {reply.author.avatar ? (
                                    <img src={reply.author.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    reply.author.displayName?.[0] || reply.author.username[0]
                                  )}
                                </div>
                              </Link>
                            </MiniProfileCard>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <MiniProfileCard username={reply.author.username}>
                                  <Link
                                    to={`/${reply.author.username}`}
                                    className="font-semibold text-sm text-white hover:text-accent-400 transition-all duration-200 interactive-link hover-scale link-underline"
                                  >
                                    {reply.author.displayName || reply.author.username}
                                  </Link>
                                </MiniProfileCard>
                                <span className="type-meta text-dark-500">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="type-body text-white/80 mt-1 break-words">
                                {reply.content}
                              </p>
                            </div>
                          </div>

                          {user?.id === reply.author.id && (
                            <button
                              onClick={() => handleRequestDeleteComment(reply.id, true, comment.id)}
                              className="p-1.5 rounded-lg text-dark-500 hover:text-coral-400 hover:bg-coral-500/10 opacity-0 group-hover/reply:opacity-100 transition-all duration-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {comments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 glass-card rounded-2xl border border-dashed border-white/10"
        >
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-4"
          >
            💬
          </motion.div>
          <h3 className="type-h3 text-white mb-2">No comments yet</h3>
          <p className="text-dark-400">Be the first to share your thoughts!</p>
        </motion.div>
      )}

      {/* Image Modal */}
      {post.image && (
        <ImageModal
          imageUrl={post.image}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDeleteComment}
        isDeleting={isDeletingComment}
        title="Delete Comment"
        message="Are you sure you want to delete the comment?"
        confirmLabel="Delete"
      />

      {isShareModalOpen && post && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={post.id}
          onShare={async (receiverId: string) => {
            await messagesApi.sendMessage(receiverId, `Shared a post`, 'post', post.id);
          }}
        />
      )}
    </div>
  );
}

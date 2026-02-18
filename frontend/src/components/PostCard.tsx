import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Trash2,
  Edit2,
  X,
  Image,
  Loader2,
  Bookmark,
  Link as LinkIcon,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Post } from "../types";
import { postsApi } from "../api/posts";
import { uploadsApi } from "../api/uploads";
import { useAuthStore } from "../store/authStore";
import ImageModal from "./ImageModal";
import MiniProfileCard from "./MiniProfileCard";
import PostActionsModal from "./PostActionsModal";
import ShareModal from "./ShareModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { messagesApi } from "../api/messages";
import { API_BASE_URL } from "../config/env";
import toast from "react-hot-toast";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onUpdate?: (updatedPost: Post) => void;
}

export default function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const [currentPost, setCurrentPost] = useState(post);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPostImageLoaded, setIsPostImageLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImage, setEditImage] = useState(post.image || "");
  const [imagePreview, setImagePreview] = useState(post.image || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(currentPost.isBookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const isOwner = user?.id === currentPost.author?.id;

  useEffect(() => {
    setIsPostImageLoaded(false);
  }, [currentPost.image]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

    const wasLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? previousCount - 1 : previousCount + 1);
    setIsLiking(true);

    if (!wasLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 450);
    }

    try {
      if (wasLiked) {
        const result = await postsApi.unlike(currentPost.id);
        setLikesCount(result.likesCount ?? previousCount - 1);
      } else {
        const result = await postsApi.like(currentPost.id);
        setLikesCount(result.likesCount ?? previousCount + 1);
      }
    } catch (error: any) {
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      console.error("Like error:", error?.response?.data || error);
      toast.error(error?.response?.data?.message || "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsActionsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await postsApi.delete(currentPost.id);
      toast.success("Post deleted");
      setIsDeleteModalOpen(false);
      onDelete?.(currentPost.id);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    setIsBookmarking(true);

    try {
      if (wasBookmarked) {
        await postsApi.unbookmark(currentPost.id);
        toast.success("Removed from bookmarks");
      } else {
        await postsApi.bookmark(currentPost.id);
        toast.success("Post bookmarked");
      }
    } catch (error) {
      setIsBookmarked(wasBookmarked);
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${currentPost.id}`;
    setIsActionsModalOpen(false);
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleEdit = () => {
    setEditContent(currentPost.content);
    setEditImage(currentPost.image || "");
    setImagePreview(currentPost.image || "");
    setIsEditing(true);
    setIsActionsModalOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(currentPost.content);
    setEditImage(currentPost.image || "");
    setImagePreview(currentPost.image || "");
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      toast.error("Please select an image file (JPG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    setIsUploadingImage(true);
    try {
      const result = await uploadsApi.uploadImage(file);
      setEditImage(`${API_BASE_URL}${result.url}`);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
      setImagePreview(currentPost.image || "");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setEditImage("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedPost = await postsApi.update(currentPost.id, {
        content: editContent.trim(),
        image: editImage || undefined,
      });

      setCurrentPost(updatedPost);
      setIsEditing(false);
      toast.success("Post updated!");
      onUpdate?.(updatedPost);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-card rounded-xl overflow-hidden card-lift"
      >
        {/* Post Content Section */}
        <article className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <MiniProfileCard username={currentPost.author.username}>
              <Link
                to={`/${currentPost.author.username}`}
                className="flex items-center gap-3 group interactive-link"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden avatar-hover" style={{ backgroundColor: "var(--accent)" }}>
                  {currentPost.author.avatar ? (
                    <img
                      src={currentPost.author.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentPost.author.displayName?.[0] ||
                    currentPost.author.username[0]
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white text-lg group-hover:text-accent-400 transition-colors link-underline">
                    {currentPost.author.displayName ||
                      currentPost.author.username}
                  </p>
                  <p className="type-meta text-dark-400 mt-1">
                    @{currentPost.author.username} ·{" "}
                    {formatDistanceToNow(new Date(currentPost.createdAt), {
                      addSuffix: true,
                    })}
                    {currentPost.updatedAt !== currentPost.createdAt && (
                      <span className="text-dark-500"> · edited</span>
                    )}
                  </p>
                </div>
              </Link>
            </MiniProfileCard>

            <button
              onClick={() => setIsActionsModalOpen(true)}
              className="p-2 text-dark-400 hover:text-white rounded-lg three-dots-hover group relative"
              style={{ 
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <MoreHorizontal className="w-5 h-5 icon-rotate" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-3">
            <Link to={`/post/${currentPost.id}`} className="block interactive-link hover-scale">
              <p className="type-post-title text-white/95 whitespace-pre-wrap hover:text-white transition-colors" style={{ color: 'var(--text-primary)' }}>
                {currentPost.content}
              </p>
            </Link>
            {currentPost.image && (
              <div className="relative w-full mt-5 rounded-xl overflow-hidden">
                {!isPostImageLoaded && (
                  <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
                )}
                <img
                  src={currentPost.image}
                  alt=""
                  onLoad={() => setIsPostImageLoaded(true)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsImageModalOpen(true);
                  }}
                  className={`w-full object-cover max-h-[460px] shadow-sm cursor-pointer media-fade-image ${
                    isPostImageLoaded ? "is-loaded" : ""
                  }`}
                  style={{ borderRadius: "10px" }}
                />
              </div>
            )}
          </div>
        </article>

        {/* Actions Section */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t soft-divider" style={{ backgroundColor: "var(--bg-secondary)" }}>
          {/* Like Button */}
          <motion.button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={`group reaction-btn relative flex items-center gap-2 px-4 py-2 rounded-full font-medium cursor-pointer select-none
              transition-all duration-200 overflow-visible interactive-btn
              ${
                isLiked
                  ? "bg-coral-500/20 text-coral-400 hover:bg-coral-500/30 hover:shadow-lg hover:shadow-coral-500/20"
                  : "bg-white/5 text-dark-300 hover:bg-white/10 hover:text-coral-400 hover:shadow-md"
              } 
              disabled:opacity-50 
              active:scale-95`}
            style={{
              color: isLiked ? 'var(--coral-text)' : undefined,
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {isAnimating && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
                <motion.span
                  className="reaction-ripple"
                  initial={{ scale: 0.5, opacity: 0.6 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                <motion.span
                  className="reaction-particle reaction-particle-1"
                  initial={{ opacity: 0.85, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: -6, y: -12 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
                <motion.span
                  className="reaction-particle reaction-particle-2"
                  initial={{ opacity: 0.85, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: 8, y: -8 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
                <motion.span
                  className="reaction-particle reaction-particle-3"
                  initial={{ opacity: 0.85, x: 0, y: 0 }}
                  animate={{ opacity: 0, x: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </span>
            )}
            <motion.span
              className="relative z-10"
              animate={
                isAnimating
                  ? {
                      filter: [
                        "drop-shadow(0 0 0 rgba(224,122,95,0))",
                        "drop-shadow(0 0 6px rgba(224,122,95,0.5))",
                        "drop-shadow(0 0 0 rgba(224,122,95,0))",
                      ],
                    }
                  : { filter: "drop-shadow(0 0 0 rgba(224,122,95,0))" }
              }
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Heart
                className={`w-5 h-5 reaction-icon ${
                  isLiked ? "fill-current" : ""
                } ${isLiked ? "" : "text-dark-300 group-hover:text-coral-400"} transition-all duration-200 ease-out`}
                style={{
                  color: isLiked ? 'var(--coral-text)' : undefined,
                }}
              />
            </motion.span>
            <span className="text-sm font-medium tabular-nums">{likesCount} Likes</span>
          </motion.button>

          {/* Comment Button */}
          <Link
            to={`/post/${currentPost.id}`}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-full 
              bg-white/5 text-dark-300 
              hover:bg-accent-500/20 hover:text-accent-400 
              hover:shadow-lg hover:shadow-accent-500/20
              transition-all duration-200 ease-out font-medium interactive-btn
              active:scale-95"
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
            <span
              className="text-sm font-medium tabular-nums relative z-10 transition-all duration-150 
              group-hover:translate-x-0.5 group-hover:text-accent-400"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              {currentPost.commentsCount || 0} Comments
            </span>
          </Link>

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsShareModalOpen(true);
            }}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-full 
              bg-white/5 text-dark-300 
              hover:bg-mint-500/20 hover:text-mint-400 
              hover:shadow-lg hover:shadow-mint-500/20
              transition-all duration-200 ease-out font-medium interactive-btn share-btn-colored
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
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'var(--overlay-light)' }}
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Post</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Content */}
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-dark-800/50 text-white placeholder-dark-400 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-500/50 resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p
                    className={`text-xs text-right mt-1 ${
                      editContent.length > 450
                        ? "text-coral-400"
                        : "text-dark-400"
                    }`}
                  >
                    {editContent.length}/500
                  </p>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-xl"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                      imagePreview
                        ? "bg-accent-500/20 text-accent-400 hover:bg-accent-500/30"
                        : "text-dark-400 hover:text-accent-400 hover:bg-accent-500/10"
                    } disabled:opacity-50`}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                    <span className="text-sm">
                      {imagePreview ? "Change Photo" : "Add Photo"}
                    </span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 interactive-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={
                        isUpdating || isUploadingImage || !editContent.trim()
                      }
                      className="px-4 py-2 rounded-xl btn-primary text-white font-semibold disabled:opacity-50 interactive-btn"
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      {currentPost.image && (
        <ImageModal
          imageUrl={currentPost.image}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      <PostActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBookmark={handleBookmark}
        onCopyLink={handleCopyLink}
        isOwner={isOwner}
        isBookmarked={isBookmarked}
        isBookmarking={isBookmarking}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Post"
        message="Are you sure you want to delete the post?"
        confirmLabel="Delete"
      />

      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={currentPost.id}
          onShare={async (receiverId: string) => {
            await messagesApi.sendMessage(receiverId, `Shared a post`, 'post', currentPost.id);
          }}
        />
      )}
    </>
  );
}

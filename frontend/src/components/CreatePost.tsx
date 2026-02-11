import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image, Send, X, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { postsApi } from "../api/posts";
import { uploadsApi } from "../api/uploads";
import { Post } from "../types";
import toast from "react-hot-toast";

const API_URL = "http://192.168.1.6:3001";

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      toast.error("Please select an image file (JPG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    // Upload to server
    setIsUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file);
      setImageUrl(result.url);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
      setImagePreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    setIsLoading(true);
    try {
      const post = await postsApi.create({
        content: content.trim(),
        image: imageUrl ? `${API_URL}${imageUrl}` : undefined,
      });

      // Ensure the post has complete author info
      const completePost = {
        ...post,
        author: post.author || {
          id: user?.id || "",
          username: user?.username || "",
          email: user?.email || "",
          displayName: user?.displayName,
          avatar: user?.avatar,
        },
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        isLiked: false,
      };

      onPostCreated(completePost);
      setContent("");
      setImageUrl("");
      setImagePreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Post created!");
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 mb-6 border-accent-500/10 shadow-xl"
    >
      <form onSubmit={handleSubmit}>
        {/* Header with avatar and text area */}
        <div className="flex gap-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg overflow-hidden avatar-hover">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              user?.displayName?.[0] || user?.username?.[0] || "U"
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-transparent text-white placeholder-dark-400 resize-none border-none focus:outline-none text-lg focus-glow rounded-lg px-1 py-1 input-smooth"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        {/* Image Preview - Full width below the text */}
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 relative group"
          >
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-72 object-cover"
              />
              {/* Uploading overlay */}
              {isUploading && (
                <div 
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3"
                  style={{ backgroundColor: 'var(--overlay-light)' }}
                >
                  <Loader2 className="w-10 h-10 text-accent-400 animate-spin" />
                  <span className="text-white text-sm font-medium">
                    Uploading...
                  </span>
                </div>
              )}
              {/* Success indicator */}
              {!isUploading && imageUrl && (
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-mint-500/90 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Ready to post
                </div>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isUploading}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-red-500/80 rounded-full text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--overlay-medium)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Action bar */}
        <div className="flex items-center justify-between mt-5 pt-5 border-t border-white/8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 interactive-btn ${
                imagePreview
                  ? "text-accent-400 bg-accent-500/10 hover:bg-accent-500/20"
                  : "text-dark-400 hover:text-accent-400 hover:bg-accent-500/10"
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Image className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {imagePreview ? "Change Photo" : "Add Photo"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${
                content.length > 450 ? "text-coral-400" : "text-dark-400"
              }`}
            >
              {content.length}/500
            </span>
            <button
              type="submit"
              disabled={isLoading || isUploading || !content.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl btn-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed interactive-btn"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

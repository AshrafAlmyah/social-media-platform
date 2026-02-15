import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { usersApi } from '../api/users';
import { uploadsApi } from '../api/uploads';
import { useAuthStore } from '../store/authStore';
import { UserProfile } from '../types';
import { API_BASE_URL } from '../config/env';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: Partial<UserProfile>) => void;
}

export default function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    avatar: profile.avatar || '',
    coverImage: profile.coverImage || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || '');
  const [coverPreview, setCoverPreview] = useState(profile.coverImage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { updateUser } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setIsUploadingAvatar(true);

    try {
      const result = await uploadsApi.uploadImage(file);
      const fullUrl = `${API_BASE_URL}${result.url}`;
      setFormData({ ...formData, avatar: fullUrl });
      setAvatarPreview(fullUrl);
      toast.success('Avatar uploaded!');
    } catch (error) {
      toast.error('Failed to upload avatar');
      setAvatarPreview(profile.avatar || '');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);
    setIsUploadingCover(true);

    try {
      const result = await uploadsApi.uploadImage(file);
      const fullUrl = `${API_BASE_URL}${result.url}`;
      setFormData({ ...formData, coverImage: fullUrl });
      setCoverPreview(fullUrl);
      toast.success('Cover image uploaded!');
    } catch (error) {
      toast.error('Failed to upload cover image');
      setCoverPreview(profile.coverImage || '');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await usersApi.updateProfile({
        displayName: formData.displayName || undefined,
        bio: formData.bio || undefined,
        avatar: formData.avatar,
        coverImage: formData.coverImage,
      });
      updateUser(updated);
      onSave(formData);
      toast.success('Profile updated!');
      onClose();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setFormData((prev) => ({ ...prev, avatar: '' }));
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setCoverPreview('');
    setFormData((prev) => ({ ...prev, coverImage: '' }));
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Cover Image
            </label>
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="relative h-24 rounded-xl bg-gradient-to-r from-accent-600/50 via-coral-500/50 to-mint-500/50 cursor-pointer overflow-hidden group border-2 border-dashed border-white/10 hover:border-accent-500/50 transition-colors"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingCover ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              {coverPreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCover();
                  }}
                  className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 hover:bg-red-600 text-white text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 cursor-pointer overflow-hidden group border-2 border-white/10 hover:border-accent-500/50 transition-colors flex-shrink-0"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                    {profile.displayName?.[0] || profile.username[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-dark-400">
                  Click to upload a new profile picture
                </p>
                <p className="text-xs text-dark-500 mt-1">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove profile picture
                  </button>
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-white/5 text-white placeholder-dark-500 focus:border-accent-500"
              placeholder="Your display name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-white/5 text-white placeholder-dark-500 focus:border-accent-500 resize-none"
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-dark-500 mt-1 text-right">
              {formData.bio.length}/200
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingAvatar || isUploadingCover}
              className="flex-1 py-3 rounded-xl btn-primary text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

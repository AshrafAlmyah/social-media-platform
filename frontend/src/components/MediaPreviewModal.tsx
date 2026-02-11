import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (caption: string) => void;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaFile: File;
  isUploading?: boolean;
}

export default function MediaPreviewModal({
  isOpen,
  onClose,
  onSend,
  mediaType,
  mediaUrl,
  mediaFile,
  isUploading = false,
}: MediaPreviewModalProps) {
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setCaption('');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSend = () => {
    if (isUploading) return;
    onSend(caption.trim());
    setCaption('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
          style={{
            backgroundColor: 'var(--overlay-dark)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 400,
              mass: 0.8
            }}
            className="glass-card rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-5 border-b border-border-color"
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Preview {mediaType === 'image' ? 'Image' : 'Video'}
              </h3>
              <motion.button
                onClick={onClose}
                disabled={isUploading}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-hover-bg-strong"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Media Preview */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 overflow-hidden flex items-center justify-center bg-black/20 p-6"
            >
              {mediaType === 'image' ? (
                <motion.img
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  src={mediaUrl}
                  alt="Preview"
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <motion.video
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  src={mediaUrl}
                  controls
                  className="max-w-full max-h-[60vh] rounded-xl shadow-2xl"
                />
              )}
            </motion.div>

            {/* Caption Input */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 border-t border-border-color space-y-4"
            >
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                disabled={isUploading}
                rows={3}
                className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-200 focus-glow"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <motion.button
                  onClick={onClose}
                  disabled={isUploading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 rounded-xl transition-all duration-200 font-medium"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSend}
                  disabled={isUploading}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                  }}
                >
                  {isUploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        whileHover={{ x: 2 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <Send className="w-4 h-4" />
                      </motion.div>
                      <span>Send</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


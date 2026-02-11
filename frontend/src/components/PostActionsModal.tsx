import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Edit2, Trash2, Bookmark, Link as LinkIcon, X } from 'lucide-react';

interface PostActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBookmark: () => void;
  onCopyLink: () => void;
  isOwner: boolean;
  isBookmarked: boolean;
  isBookmarking: boolean;
}

export default function PostActionsModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onBookmark,
  onCopyLink,
  isOwner,
  isBookmarked,
  isBookmarking,
}: PostActionsModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'var(--overlay-dark)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="glass-card rounded-2xl shadow-2xl border border-border-color max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--card-bg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-color">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Post Actions
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-all duration-200 interactive-btn hover:scale-110"
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg-strong)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actions */}
              <div className="p-2">
                {isOwner && (
                  <>
                    <button
                      onClick={() => handleAction(onEdit)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 interactive-btn mb-2"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg-strong)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Edit2 className="w-5 h-5 icon-bounce" />
                      <span className="font-medium">Edit Post</span>
                    </button>

                    <button
                      onClick={() => handleAction(onDelete)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 interactive-btn mb-2"
                      style={{
                        color: 'var(--coral-text)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg-strong)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium">Delete Post</span>
                    </button>

                    <div
                      className="my-2 mx-4"
                      style={{ borderTop: '1px solid var(--border-color)' }}
                    />
                  </>
                )}

                <button
                  onClick={() => handleAction(onBookmark)}
                  disabled={isBookmarking}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 interactive-btn mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg-strong)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Bookmark
                    className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
                  />
                  <span className="font-medium">
                    {isBookmarked ? 'Remove from Bookmarks' : 'Add to Bookmarks'}
                  </span>
                </button>

                <button
                  onClick={() => handleAction(onCopyLink)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 interactive-btn"
                  style={{
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="font-medium">Copy Link</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


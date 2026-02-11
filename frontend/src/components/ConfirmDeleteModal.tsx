import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Delete',
  message = 'Are you sure you want to delete this item?',
  confirmLabel = 'Delete',
}: ConfirmDeleteModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'var(--overlay-dark)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="glass-card rounded-2xl shadow-2xl border border-border-color max-w-md w-full"
              style={{ backgroundColor: 'var(--card-bg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border-color">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-all duration-200 interactive-btn hover:scale-110"
                  style={{ color: 'var(--text-secondary)' }}
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

              <div className="p-5">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {message}
                </p>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-200 interactive-btn"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 interactive-btn btn-primary disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

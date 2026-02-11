import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen, imageUrl]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
          style={{
            backdropFilter: 'blur(12px)',
            backgroundColor: 'var(--overlay-dark)',
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 400,
              mass: 0.8
            }}
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              initial={{ scale: 0, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 90 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 20 }}
              onClick={onClose}
              whileHover={{ 
                scale: 1.15, 
                rotate: 90,
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
              }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/10"
              style={{
                backgroundColor: 'var(--overlay-medium)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--overlay-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--overlay-medium)';
              }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Loading indicator */}
            <AnimatePresence>
              {!imageLoaded && !imageError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  >
                    <Loader2 className="w-8 h-8 text-white/70 drop-shadow-lg" style={{ color: 'var(--text-opacity-70)' }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image */}
            <AnimatePresence mode="wait">
              {imageError ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white/60 text-center"
                  style={{ color: 'var(--text-opacity-60)' }}
                >
                  <p>Failed to load image</p>
                </motion.div>
              ) : (
                <motion.img
                  key={imageUrl}
                  src={imageUrl}
                  alt=""
                  initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                  animate={{ 
                    opacity: imageLoaded ? 1 : 0, 
                    scale: imageLoaded ? 1 : 0.92,
                    filter: imageLoaded ? 'blur(0px)' : 'blur(8px)',
                  }}
                  exit={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1],
                    filter: { duration: 0.3 },
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(false);
                  }}
                  whileHover={{ 
                    scale: 1.03,
                    transition: { duration: 0.3, ease: 'easeOut' },
                  }}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-out ring-1 ring-white/10"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


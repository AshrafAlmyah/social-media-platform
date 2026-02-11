import { motion } from 'framer-motion';

interface PostSkeletonProps {
  index?: number;
}

export default function PostSkeleton({ index = 0 }: PostSkeletonProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: 'easeOut',
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl p-6 mb-4"
    >
      <motion.div 
        variants={itemVariants}
        className="flex items-center gap-3 mb-4"
      >
        <motion.div
          variants={itemVariants}
          className="w-11 h-11 rounded-full bg-white/10 skeleton-shimmer"
        />
        <div className="flex-1">
          <motion.div
            variants={itemVariants}
            className="h-4 w-32 bg-white/10 rounded mb-2 skeleton-shimmer"
          />
          <motion.div
            variants={itemVariants}
            className="h-3 w-48 bg-white/5 rounded skeleton-shimmer"
          />
        </div>
      </motion.div>
      <motion.div 
        variants={itemVariants}
        className="space-y-2 mb-4"
      >
        <motion.div
          variants={itemVariants}
          className="h-4 bg-white/10 rounded w-full skeleton-shimmer"
        />
        <motion.div
          variants={itemVariants}
          className="h-4 bg-white/10 rounded w-5/6 skeleton-shimmer"
        />
        <motion.div
          variants={itemVariants}
          className="h-4 bg-white/10 rounded w-4/6 skeleton-shimmer"
        />
      </motion.div>
      {/* Optional image skeleton */}
      <motion.div
        variants={itemVariants}
        className="h-64 bg-white/5 rounded-xl mb-4 skeleton-shimmer"
      />
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-3 pt-4 border-t border-white/5"
      >
        <motion.div
          variants={itemVariants}
          className="h-8 w-20 bg-white/10 rounded-full skeleton-shimmer"
        />
        <motion.div
          variants={itemVariants}
          className="h-8 w-20 bg-white/10 rounded-full skeleton-shimmer"
        />
      </motion.div>
    </motion.div>
  );
}


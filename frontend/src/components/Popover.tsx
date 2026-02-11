import { ReactNode, useEffect, useRef, useImperativeHandle, forwardRef, cloneElement, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopover, UsePopoverOptions } from '../hooks/usePopover';

export interface PopoverHandle {
  close: () => void;
}

interface PopoverProps extends UsePopoverOptions {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const Popover = forwardRef<PopoverHandle, PopoverProps>(function Popover(
  {
    trigger,
    children,
    className = '',
    contentClassName = '',
    ...options
  },
  ref
) {
  const { isOpen, position, triggerRef, popoverRef, toggle, close } = usePopover(options);

  useImperativeHandle(ref, () => ({
    close,
  }));

  // Clone trigger element and add onClick handler
  const triggerWithClick = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Call original onClick if it exists first
          const originalOnClick = (trigger as any).props?.onClick;
          if (originalOnClick) {
            originalOnClick(e);
          }
          
          // Then toggle the popover
          toggle();
        },
        type: 'button', // Ensure it's a button type
        ref: (node: HTMLButtonElement | null) => {
          // Set the trigger ref directly
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          // Call original ref if it exists
          const originalRef = (trigger as any).ref;
          if (typeof originalRef === 'function') {
            originalRef(node);
          } else if (originalRef) {
            originalRef.current = node;
          }
        },
      } as any)
    : trigger;

  return (
    <div className={`relative ${className}`}>
      {triggerWithClick}

      <AnimatePresence>
        {isOpen && position && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ backgroundColor: 'var(--overlay-medium)' }}
              onClick={toggle}
            />

            {/* Popover */}
            <motion.div
              ref={popoverRef}
              initial={{ 
                opacity: 0, 
                scale: 0.95,
                y: position.placement === 'top' ? 10 : -10,
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95,
                y: position.placement === 'top' ? 10 : -10,
              }}
              transition={{ 
                duration: 0.2, 
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 50,
              }}
              className={`glass-card rounded-xl py-1 shadow-2xl border border-border-color ${contentClassName}`}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Popover;


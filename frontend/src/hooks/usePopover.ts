import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePopoverOptions {
  placement?: 'top' | 'bottom' | 'auto';
  offset?: number;
  onClose?: () => void;
}

interface PopoverPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

export function usePopover(options: UsePopoverOptions = {}) {
  const { placement: preferredPlacement = 'auto', offset = 8, onClose } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Determine placement
    let placement: 'top' | 'bottom' = 'bottom';
    if (preferredPlacement === 'auto') {
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      placement = spaceBelow < popoverRect.height && spaceAbove > spaceBelow ? 'top' : 'bottom';
    } else {
      placement = preferredPlacement;
    }

    // Calculate horizontal position (prefer right alignment, adjust if needed)
    let left = triggerRect.right - popoverRect.width;
    const minLeft = 8; // Minimum distance from left edge
    const maxLeft = viewportWidth - popoverRect.width - 8; // Minimum distance from right edge

    // On mobile, center if popover is wider than viewport
    if (popoverRect.width >= viewportWidth - 16) {
      left = (viewportWidth - popoverRect.width) / 2;
    } else if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }

    // Calculate vertical position
    let top: number;
    if (placement === 'top') {
      top = triggerRect.top - popoverRect.height - offset;
    } else {
      top = triggerRect.bottom + offset;
    }

    // Ensure popover doesn't go off screen vertically
    if (top < 8) {
      top = 8;
    } else if (top + popoverRect.height > viewportHeight - 8) {
      top = viewportHeight - popoverRect.height - 8;
    }

    setPosition({ top, left, placement });
  }, [preferredPlacement, offset]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen) {
      // Multiple attempts to ensure DOM is fully rendered and dimensions are available
      const attemptCalculate = () => {
        if (popoverRef.current && triggerRef.current) {
          const rect = popoverRef.current.getBoundingClientRect();
          // Only calculate if popover has dimensions
          if (rect.width > 0 && rect.height > 0) {
            calculatePosition();
          } else {
            // Retry if dimensions not ready
            requestAnimationFrame(attemptCalculate);
          }
        }
      };
      
      // Initial attempt after a small delay
      setTimeout(() => {
        requestAnimationFrame(attemptCalculate);
      }, 0);
    }
  }, [isOpen, calculatePosition]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, calculatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside trigger or popover
      const isClickOnTrigger = triggerRef.current && (
        triggerRef.current.contains(target) || 
        triggerRef.current === target ||
        triggerRef.current === (target as any).closest?.('button')
      );
      
      const isClickOnPopover = popoverRef.current && popoverRef.current.contains(target);
      
      if (isClickOnTrigger || isClickOnPopover) {
        return;
      }
      
      close();
    };

    // Use a delay to avoid closing immediately when opening
    // This allows the toggle to complete before checking for outside clicks
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, close, triggerRef]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  return {
    isOpen,
    position,
    triggerRef,
    popoverRef,
    open,
    close,
    toggle,
  };
}


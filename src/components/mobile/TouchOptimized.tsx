import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hapticFeedback?: boolean;
  pressScale?: number;
  children: React.ReactNode;
}

// Touch-optimized button with haptic feedback
export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  hapticFeedback = true,
  pressScale = 0.95,
  className,
  children,
  onTouchStart,
  onTouchEnd,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Light haptic feedback
    }
    onTouchStart?.(e);
  }, [hapticFeedback, onTouchStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    onTouchEnd?.(e);
  }, [onTouchEnd]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
    onClick?.(e);
  }, [hapticFeedback, onClick]);

  return (
    <button
      {...props}
      className={cn(
        'transition-all duration-150 ease-out',
        'touch-manipulation', // Optimize for touch
        'min-h-[44px] min-w-[44px]', // Minimum touch target size
        'active:scale-95',
        className
      )}
      style={{
        transform: isPressed ? `scale(${pressScale})` : 'scale(1)',
        WebkitTapHighlightColor: 'transparent' // Remove iOS blue highlight
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

// Enhanced scroll area for mobile
export const MobileScrollArea: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'overflow-auto',
        '-webkit-overflow-scrolling: touch', // iOS smooth scrolling
        'scroll-smooth',
        className
      )}
      style={{
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        WebkitOverflowScrolling: 'touch' // iOS momentum scrolling
      }}
    >
      {children}
    </div>
  );
};

// Pull-to-refresh component
export const PullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}> = ({ onRefresh, children, threshold = 80 }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300"
        style={{
          height: pullDistance,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`
        }}
      >
        {isRefreshing ? (
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        ) : (
          <div className="text-muted-foreground text-sm">
            {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Swipe gesture handler
export const SwipeHandler: React.FC<{
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  children: React.ReactNode;
}> = ({ 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown, 
  threshold = 50,
  children 
}) => {
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
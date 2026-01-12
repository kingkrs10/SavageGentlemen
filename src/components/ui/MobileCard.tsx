import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTouchDevice } from "@/hooks/use-mobile";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  elevated?: boolean;
}

export function MobileCard({ 
  children, 
  className, 
  onClick, 
  interactive = false,
  elevated = false
}: MobileCardProps) {
  const isTouchDevice = useTouchDevice();
  
  return (
    <div
      className={cn(
        "mobile-card bg-card text-card-foreground",
        interactive && "cursor-pointer touch-optimized",
        interactive && isTouchDevice && "haptic-light",
        elevated && "shadow-lg",
        "transition-all duration-200 ease-out",
        className
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
}
import React from 'react';

interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * BrandLoader component displays a branded loading animation
 * - Uses brand colors and styling for a consistent experience
 * - Available in different sizes with sm, md and lg options
 * - Can be customized with additional className
 */
const BrandLoader: React.FC<BrandLoaderProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const sizeClass = sizeClasses[size];
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeClass}`}>
        {/* Main circle with brand color */}
        <div className={`absolute inset-0 rounded-full border-4 border-primary/30`}></div>
        
        {/* Spinner arc */}
        <div className={`
          absolute inset-0 rounded-full border-4 border-transparent 
          border-t-primary animate-[spin_1.5s_ease-in-out_infinite]
        `}></div>
        
        {/* Inner dot that moves with a bounce */}
        <div className={`
          absolute top-0 left-1/2 w-3 h-3 -ml-1.5 rounded-full bg-primary
          animate-[bounce_1.5s_ease-in-out_infinite]
        `}></div>
      </div>
    </div>
  );
};

export default BrandLoader;
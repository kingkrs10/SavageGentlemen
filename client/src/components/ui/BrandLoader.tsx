import React from 'react';
import SGFlyerLogoPng from '@/assets/SGFLYERLOGO.png';

interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  message?: string;
}

const BrandLoader: React.FC<BrandLoaderProps> = ({ 
  size = 'md', 
  fullScreen = false,
  message = 'Loading...'
}) => {
  // Determine the size class based on the size prop
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
    xl: 'h-60 w-60'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50' 
    : 'flex flex-col items-center justify-center';

  const logoSize = sizeClasses[size];

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Pulsating background for the logo */}
        <div className={`${logoSize} rounded-full bg-primary/20 animate-pulse absolute -inset-4 blur-lg`}></div>
        
        {/* Main logo with slight bounce animation */}
        <img 
          src={SGFlyerLogoPng} 
          alt="Savage Gentlemen" 
          className={`${logoSize} object-contain relative z-10 animate-bounce-slow`}
        />
        
        {/* Rotating ring around the logo */}
        <div className={`absolute inset-0 rounded-full border-4 border-t-primary border-r-primary/50 border-b-primary/30 border-l-transparent animate-spin`}></div>
      </div>
      
      {message && (
        <p className="mt-6 text-white uppercase tracking-widest text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default BrandLoader;
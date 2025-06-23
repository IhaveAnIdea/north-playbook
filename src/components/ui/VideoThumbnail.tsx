'use client';

import React from 'react';

interface VideoThumbnailProps {
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function VideoThumbnail({ 
  alt = "Video", 
  size = 'md',
  className = '',
  onClick 
}: VideoThumbnailProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-gradient-to-br from-red-100 to-red-200 rounded-md border border-red-300 hover:border-red-400 transition-colors flex items-center justify-center ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
      onClick={handleClick}
      title={alt}
    >
      <div className="flex flex-col items-center justify-center">
        <span className={`${iconSizes[size]} text-red-600`}>🎬</span>
        {size !== 'sm' && (
          <span className="text-xs text-red-700 font-medium mt-1">Video</span>
        )}
      </div>
    </div>
  );
} 
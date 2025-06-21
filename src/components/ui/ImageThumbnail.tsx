'use client';

import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

interface ImageThumbnailProps {
  s3Key: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function ImageThumbnail({ 
  s3Key, 
  alt = "Image", 
  size = 'md',
  className = '',
  onClick 
}: ImageThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32'
  };

  useEffect(() => {
    const getImageUrl = async () => {
      try {
        const result = await getUrl({ key: s3Key });
        setImageUrl(result.url.toString());
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting image URL:', error);
        setError(true);
        setIsLoading(false);
      }
    };

    getImageUrl();
  }, [s3Key]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded-md flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded-md flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-xs">❌</span>
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-md overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors ${onClick || imageUrl ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <img 
        src={imageUrl} 
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform"
      />
    </div>
  );
} 
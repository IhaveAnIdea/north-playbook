'use client';

import React from 'react';

interface DocumentThumbnailProps {
  fileName?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function DocumentThumbnail({ 
  fileName,
  alt = "Document", 
  size = 'md',
  className = '',
  onClick 
}: DocumentThumbnailProps) {
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

  // Get file extension for icon
  const getFileIcon = (fileName?: string) => {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📕';
      case 'doc':
      case 'docx': return '📘';
      case 'txt': return '📝';
      case 'csv': return '📊';
      case 'xls':
      case 'xlsx': return '📗';
      default: return '📄';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-gradient-to-br from-blue-100 to-blue-200 rounded-md border border-blue-300 hover:border-blue-400 transition-colors flex items-center justify-center ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
      onClick={handleClick}
      title={alt}
    >
      <div className="flex flex-col items-center justify-center">
        <span className={`${iconSizes[size]} text-blue-600`}>{getFileIcon(fileName)}</span>
        {size !== 'sm' && (
          <span className="text-xs text-blue-700 font-medium mt-1">Doc</span>
        )}
      </div>
    </div>
  );
} 
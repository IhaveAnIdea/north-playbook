'use client';

import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import VideoPlayer from './VideoPlayer';

interface VideoPlayerWrapperProps {
  src?: string;
  s3Key?: string;
  title?: string;
  showDownload?: boolean;
  poster?: string;
}

export default function VideoPlayerWrapper({ 
  src, 
  s3Key, 
  title, 
  showDownload = true, 
  poster 
}: VideoPlayerWrapperProps) {
  const [videoUrl, setVideoUrl] = useState<string>(src || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getVideoUrl = async () => {
      // If we have a direct src URL, use it
      if (src && src.trim() && !src.includes('/uploads/')) {
        setVideoUrl(src);
        return;
      }

      // If we have an s3Key, get the URL from Amplify
      if (s3Key && s3Key.trim()) {
        setLoading(true);
        setError(null);
        try {
          const result = await getUrl({ key: s3Key });
          setVideoUrl(result.url.toString());
        } catch (err) {
          console.error('Error getting video URL from S3:', err);
          setError('Failed to load video');
        } finally {
          setLoading(false);
        }
        return;
      }

      // If src is a local /uploads/ path, it's invalid for S3 storage
      if (src && src.includes('/uploads/')) {
        setError('Invalid video URL - file not found');
        return;
      }

      // No valid source
      setError('No video source provided');
    };

    getVideoUrl();
  }, [src, s3Key]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-200 flex items-center justify-center rounded">
        <div className="text-gray-500">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-red-50 border border-red-200 flex items-center justify-center rounded">
        <div className="text-red-600 text-center">
          <div>⚠️ {error}</div>
          {s3Key && (
            <div className="text-xs mt-1 text-red-500">S3 Key: {s3Key}</div>
          )}
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded">
        <div className="text-gray-500">No video available</div>
      </div>
    );
  }

  return (
    <VideoPlayer 
      src={videoUrl}
      title={title}
      showDownload={showDownload}
      poster={poster}
    />
  );
} 
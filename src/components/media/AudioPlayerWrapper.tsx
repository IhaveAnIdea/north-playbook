'use client';

import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import AudioPlayer from './AudioPlayer';

interface AudioPlayerWrapperProps {
  src?: string;
  s3Key?: string;
  title?: string;
  showDownload?: boolean;
}

export default function AudioPlayerWrapper({ 
  src, 
  s3Key, 
  title, 
  showDownload = true 
}: AudioPlayerWrapperProps) {
  const [audioUrl, setAudioUrl] = useState<string>(src || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getAudioUrl = async () => {
      // If we have a direct src URL, use it
      if (src && src.trim() && !src.includes('/uploads/')) {
        setAudioUrl(src);
        return;
      }

      // If we have an s3Key, get the URL from Amplify
      if (s3Key && s3Key.trim()) {
        setLoading(true);
        setError(null);
        try {
          const result = await getUrl({ key: s3Key });
          setAudioUrl(result.url.toString());
        } catch (err) {
          console.error('Error getting audio URL from S3:', err);
          setError('Failed to load audio');
        } finally {
          setLoading(false);
        }
        return;
      }

      // If src is a local /uploads/ path, it's invalid for S3 storage
      if (src && src.includes('/uploads/')) {
        setError('Invalid audio URL - file not found');
        return;
      }

      // No valid source
      setError('No audio source provided');
    };

    getAudioUrl();
  }, [src, s3Key]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
        <div className="text-gray-500 text-sm">Loading audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
        <div className="text-red-600 text-sm">
          ⚠️ {error}
          {s3Key && (
            <div className="text-xs mt-1 text-red-500">S3 Key: {s3Key}</div>
          )}
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
        <div className="text-gray-500 text-sm">No audio available</div>
      </div>
    );
  }

  return (
    <AudioPlayer 
      src={audioUrl}
      title={title}
      showDownload={showDownload}
    />
  );
} 
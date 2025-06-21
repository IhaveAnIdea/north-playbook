'use client';

import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import DocumentThumbnail, { DocumentData } from './DocumentThumbnail';

interface DocumentThumbnailWrapperProps {
  document: DocumentData;
  onRemove?: (documentId: string) => void;
  showDownload?: boolean;
  showRemove?: boolean;
}

export default function DocumentThumbnailWrapper({ 
  document,
  onRemove,
  showDownload = true,
  showRemove = false 
}: DocumentThumbnailWrapperProps) {
  const [documentData, setDocumentData] = useState<DocumentData>(document);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDocumentUrl = async () => {
      // If we have a direct URL that's not a local path, use it
      if (document.url && document.url.trim() && !document.url.includes('/uploads/')) {
        setDocumentData(document);
        return;
      }

      // If we have an s3Key, get the URL from Amplify
      if (document.s3Key && document.s3Key.trim()) {
        setLoading(true);
        setError(null);
        try {
          const result = await getUrl({ key: document.s3Key });
          setDocumentData({
            ...document,
            url: result.url.toString()
          });
        } catch (err) {
          console.error('Error getting document URL from S3:', err);
          setError('Failed to load document');
          setDocumentData({
            ...document,
            url: '' // Clear invalid URL
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      // If URL is a local /uploads/ path, it's invalid for S3 storage
      if (document.url && document.url.includes('/uploads/')) {
        setError('Invalid document URL - file not found');
        setDocumentData({
          ...document,
          url: '' // Clear invalid URL
        });
        return;
      }

      // Use the document as-is if no S3 key
      setDocumentData(document);
    };

    getDocumentUrl();
  }, [document.url, document.s3Key, document.id]);

  if (loading) {
    return (
      <div className="w-48 h-60 bg-gray-200 flex items-center justify-center rounded border">
        <div className="text-gray-500 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <div className="text-sm">Loading document...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-48 h-60 bg-red-50 border border-red-200 flex items-center justify-center rounded">
        <div className="text-red-600 text-center p-4">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm mb-2">{error}</div>
          <div className="text-xs text-red-500">
            {document.name}
            {document.s3Key && (
              <div className="mt-1">S3 Key: {document.s3Key}</div>
            )}
          </div>
          {showRemove && onRemove && (
            <button
              onClick={() => onRemove(document.id)}
              className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DocumentThumbnail 
      document={documentData}
      onRemove={onRemove}
      showDownload={showDownload}
      showRemove={showRemove}
    />
  );
} 
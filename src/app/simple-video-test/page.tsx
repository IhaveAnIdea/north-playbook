'use client';

import React, { useState } from 'react';

export default function SimpleVideoTestPage() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('Ready');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('Uploading...');
    console.log('File selected:', file.name, file.type, file.size);

    try {
      // Create FormData and upload to our storage service
      const formData = new FormData();
      formData.append('file', file);
      formData.append('exerciseId', 'test-exercise');
      formData.append('category', 'test-video');

      // Call the real storage service (Amplify)
      const { storageService } = await import('@/lib/storage-service');
      
      const result = await storageService.uploadPlaybookAsset(file, {
        exerciseId: 'test-exercise',
        category: 'test-video',
      });

      console.log('Upload result:', result);
      
      // Use the URL returned by the storage service
      setVideoUrl(result.url);
      setUploadStatus(`Uploaded: ${result.key}`);

      // Test the URL
      console.log('Testing URL:', result.url);
      const testResponse = await fetch(result.url);
      console.log('Test response:', testResponse.status, testResponse.statusText);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Simple Video Upload Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Upload Video</h2>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          style={{ marginBottom: '10px', width: '100%' }}
        />
        <p>Status: {uploadStatus}</p>
      </div>

      {videoUrl && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Video Player Test</h2>
          <p>Video URL: <code>{videoUrl}</code></p>
          
          <video 
            src={videoUrl}
            controls
            style={{ width: '100%', maxWidth: '600px', height: 'auto' }}
            onError={(e) => {
              console.error('Video error:', e);
              const target = e.target as HTMLVideoElement;
              console.error('Video error details:', target.error);
            }}
            onLoadStart={() => console.log('Video load started')}
            onLoadedData={() => console.log('Video data loaded')}
            onCanPlay={() => console.log('Video can play')}
          >
            Your browser does not support the video tag.
          </video>
          
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => {
                const video = document.querySelector('video') as HTMLVideoElement;
                if (video) {
                  video.load();
                  console.log('Video reload triggered');
                }
              }}
              style={{ padding: '8px 16px', marginRight: '10px' }}
            >
              Reload Video
            </button>
            
            <button 
              onClick={async () => {
                console.log('Testing direct fetch...');
                try {
                  const response = await fetch(videoUrl);
                  console.log('Direct fetch response:', response.status, response.statusText);
                  const blob = await response.blob();
                  console.log('Blob:', blob.type, blob.size);
                } catch (error) {
                  console.error('Direct fetch error:', error);
                }
              }}
              style={{ padding: '8px 16px' }}
            >
              Test Direct Fetch
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
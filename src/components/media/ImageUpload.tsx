'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Image as ImageIcon,
  Add,
} from '@mui/icons-material';
import { storageService } from '@/lib/storage-service';

export interface ImageData {
  id: string;
  name: string;
  url: string;
  caption?: string;
  size?: number;
  type?: string;
  s3Key?: string; // S3 storage key
  metadata?: Record<string, unknown>; // S3 metadata
}

interface ImageUploadProps {
  images?: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
  acceptedTypes?: string[];
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: 'text' | 'audio' | 'video';
  mood?: string;
  tags?: string[];
}

export default function ImageUpload({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxSizePerImage = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  exerciseId,
  exerciseTitle,
  category,
  responseType,
  mood,
  tags = []
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSizePerImage * 1024 * 1024) {
      return `File size must be less than ${maxSizePerImage}MB`;
    }
    
    if (images.length >= maxImages) {
      return `Maximum ${maxImages} images allowed`;
    }
    
    return null;
  };

  const uploadFile = async (file: File, description?: string): Promise<ImageData> => {
    const uploadOptions = {
      exerciseId,
      exerciseTitle,
      category,
      responseType,
      mood,
      tags,
      description
    };

    try {
      // Upload to storage service
      const result = await storageService.uploadPlaybookAsset(file, uploadOptions);
      
      // Save to database via API route instead of direct import
      try {
        const response = await fetch('/api/media/save-asset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: result.key,
            s3Bucket: 'north-playbook',
            fileName: file.name,
            fileType: 'image',
            fileSize: file.size,
            mimeType: file.type,
            exerciseId: uploadOptions?.exerciseId,
            category: uploadOptions?.category,
            tags: uploadOptions?.tags,
            description: uploadOptions?.description
          }),
        });

        if (!response.ok) {
          console.warn('Failed to save media asset to database via API');
        }
      } catch (dbError) {
        console.warn('Failed to save media asset to database:', dbError);
        // Continue anyway - the file is still uploaded to storage
      }

      return {
        id: result.key, // Use S3 key as ID
        name: file.name,
        url: result.url,
        caption: description,
        size: file.size,
        type: file.type,
        s3Key: result.key,
        metadata: {
          userId: 'user-id',
          exerciseId: uploadOptions?.exerciseId,
          exerciseTitle: uploadOptions?.exerciseTitle,
          category: uploadOptions?.category,
          responseType: uploadOptions?.responseType,
          mood: uploadOptions?.mood,
          tags: uploadOptions?.tags,
          uploadDate: new Date().toISOString(),
          fileType: file.type,
          originalName: file.name,
          description: uploadOptions?.description
        } as Record<string, unknown>
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Failed to upload ${file.name}: ${error}`);
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);
    
    const fileArray = Array.from(files);
    const newImages: ImageData[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 100);

        const imageData = await uploadFile(file);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        newImages.push(imageData);
        
        // Clean up progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });
        }, 1000);
        
      } catch (error) {
        errors.push(`${file.name}: ${error}`);
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
    
    setUploading(false);
  }, [images, onImagesChange, maxImages, maxSizePerImage, acceptedTypes, exerciseId, exerciseTitle, category, responseType, mood, tags]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  const handleRemoveImage = async (imageId: string) => {
    try {
      const imageToRemove = images.find(img => img.id === imageId);
      if (imageToRemove?.s3Key) {
        await storageService.deleteAsset(imageToRemove.s3Key);
      }
      
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Error removing image:', error);
      setError(`Failed to remove image: ${error}`);
    }
  };

  const handleUpdateCaption = (imageId: string, caption: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, caption } : img
    );
    onImagesChange(updatedImages);
  };

  return (
    <Box>
      {/* Development Mode Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Development Mode:</strong> Files are stored locally in browser memory. 
          They will be lost when you refresh the page.
        </Alert>
      )}

      {/* Upload Area */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          bgcolor: dragOver ? 'primary.50' : 'grey.50',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50'
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('image-upload-input')?.click()}
      >
        <Stack alignItems="center" spacing={2}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h6" textAlign="center">
            Drop images here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Supports: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
            <br />
            Max size: {maxSizePerImage}MB per image, {maxImages} images total
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            disabled={uploading || images.length >= maxImages}
          >
            Select Images
          </Button>
        </Stack>
      </Card>

      <input
        id="image-upload-input"
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </Alert>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box sx={{ mb: 2 }}>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Box key={fileName} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 0, flex: 1 }} noWrap>
                  Uploading {fileName}...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress}%
                </Typography>
              </Box>
              <Box sx={{ width: '100%', mt: 0.5 }}>
                <CircularProgress
                  variant="determinate"
                  value={progress}
                  size={20}
                  sx={{ color: 'primary.main' }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon fontSize="small" />
            Uploaded Images ({images.length}/{maxImages})
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {images.map((image) => (
              <Card key={image.id} sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height={150}
                  image={image.url}
                  alt={image.name}
                  sx={{ objectFit: 'cover' }}
                />
                
                <Box sx={{ p: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add caption..."
                    value={image.caption || ''}
                    onChange={(e) => handleUpdateCaption(image.id, e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`${(image.size! / 1024 / 1024).toFixed(1)}MB`}
                      size="small"
                      variant="outlined"
                    />
                    {image.metadata?.category && (
                      <Chip
                        label={String(image.metadata.category)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
                
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
                  }}
                  size="small"
                  onClick={() => handleRemoveImage(image.id)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
} 
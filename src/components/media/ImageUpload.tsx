'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Card,
  CardMedia,
  CardActions,
  Stack,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Download,
  Visibility,
} from '@mui/icons-material';

interface ImageUploadProps {
  onImageUpload: (imageData: ImageData) => void;
  onImageRemove?: (imageId: string) => void;
  existingImages?: ImageData[];
  maxImages?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

export interface ImageData {
  id: string;
  file?: File;
  url: string;
  name: string;
  size: number;
  type: string;
  caption?: string;
  uploadedAt: Date;
}

export default function ImageUpload({
  onImageUpload,
  onImageRemove,
  existingImages = [],
  maxImages = 5,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  disabled = false,
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // Check if we've reached max images
    if (existingImages.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    // Create image data
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData: ImageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: e.target?.result as string,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      };

      onImageUpload(imageData);
      setUploading(false);
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!acceptedFormats.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Please use: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
      };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size too large. Maximum size is ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveImage = (imageId: string) => {
    if (onImageRemove) {
      onImageRemove(imageId);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUploadMore = existingImages.length < maxImages;

  return (
    <Box>
      {/* Upload Area */}
      {canUploadMore && (
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: dragOver ? 'primary.50' : 'grey.50',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.5 : 1,
            '&:hover': {
              borderColor: disabled ? 'grey.300' : 'primary.main',
              bgcolor: disabled ? 'grey.50' : 'primary.50',
            },
          }}
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag and drop an image here, or click to select
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            Supported formats: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • 
            Max size: {maxSizeMB}MB • 
            Max images: {maxImages}
          </Typography>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Images ({existingImages.length}/{maxImages})
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {existingImages.map((image) => (
              <Card key={image.id} sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="150"
                  image={image.url}
                  alt={image.name}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" noWrap title={image.name}>
                      {image.name}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatFileSize(image.size)}
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => window.open(image.url, '_blank')}
                      title="View full size"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = image.url;
                        link.download = image.name;
                        link.click();
                      }}
                      title="Download"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    
                    {onImageRemove && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveImage(image.id)}
                        title="Remove"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Upload Limit Reached */}
      {!canUploadMore && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Maximum number of images ({maxImages}) reached. Remove an image to upload a new one.
          </Typography>
        </Alert>
      )}
    </Box>
  );
} 
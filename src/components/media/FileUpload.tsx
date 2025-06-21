'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  IconButton,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Description,
  Image,
  VideoFile,
  AudioFile,
} from '@mui/icons-material';
import { storageService } from '@/lib/storage-service';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import DocumentThumbnail from './DocumentThumbnail';
import ImageGallery from './ImageGallery';

export interface FileData {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  fileCategory: 'image' | 'video' | 'audio' | 'document';
  s3Key?: string;
  metadata?: Record<string, unknown>;
}

interface FileUploadProps {
  files?: FileData[];
  onFilesChange: (files: FileData[]) => void;
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: 'text' | 'audio' | 'video';
  mood?: string;
  tags?: string[];
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizePerFile?: number;
}

const getFileCategory = (file: File): 'image' | 'video' | 'audio' | 'document' => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension || '')) return 'image';
  if (['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension || '')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma'].includes(extension || '')) return 'audio';
  
  return 'document';
};

const getFileIcon = (category: string) => {
  switch (category) {
    case 'image': return <Image color="primary" />;
    case 'video': return <VideoFile color="secondary" />;
    case 'audio': return <AudioFile color="info" />;
    default: return <Description color="action" />;
  }
};

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export default function FileUpload({
  files = [],
  onFilesChange,
  exerciseId,
  exerciseTitle,
  category,
  responseType,
  mood,
  tags = [],
  acceptedTypes = [
    'image/*', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
    'video/*', '.mp4', '.webm', '.avi', '.mov', '.wmv', '.flv', '.mkv',
    'audio/*', '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma',
    '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'
  ],
  maxFiles = 10,
  maxSizePerFile = 50
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxSizePerFile}MB.`;
    }

    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed.`;
    }

    return null;
  };

  const handleFileUpload = async (selectedFiles: FileList) => {
    setError(null);
    setUploading(true);

    const fileArray = Array.from(selectedFiles);
    const newFiles: FileData[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      try {
        const uploadOptions = {
          exerciseId,
          exerciseTitle,
          category,
          responseType,
          mood,
          tags
        };

        const result = await storageService.uploadPlaybookAsset(file, uploadOptions);
        const fileCategory = getFileCategory(file);

        newFiles.push({
          id: result.key,
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          fileCategory,
          s3Key: result.key,
          metadata: result.metadata
        });
      } catch (err) {
        errors.push(`Failed to upload "${file.name}": ${err}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }

    setUploading(false);
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  const filesByCategory = files.reduce((acc, file) => {
    if (!acc[file.fileCategory]) {
      acc[file.fileCategory] = [];
    }
    acc[file.fileCategory].push(file);
    return acc;
  }, {} as Record<string, FileData[]>);

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3, border: '2px dashed', borderColor: 'grey.300' }}>
        <Stack spacing={2} alignItems="center">
          <CloudUpload sx={{ fontSize: 48, color: 'grey.400' }} />
          <Typography variant="h6">Upload Files</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Upload images, videos, audio files, or documents
          </Typography>
          
          <Button
            variant="contained"
            component="label"
            disabled={uploading || files.length >= maxFiles}
            size="large"
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
            <input
              type="file"
              hidden
              multiple
              accept={acceptedTypes.join(',')}
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </Button>

          <Typography variant="caption" color="text.secondary">
            Maximum {maxFiles} files, {maxSizePerFile}MB each
          </Typography>
        </Stack>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
            {error}
          </pre>
        </Alert>
      )}

      {files.length > 0 && (
        <Stack spacing={3}>
          {filesByCategory.image && filesByCategory.image.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Images ({filesByCategory.image.length})
              </Typography>
              <ImageGallery
                images={filesByCategory.image.map(file => ({
                  id: file.id,
                  name: file.name,
                  url: file.url,
                  size: file.size,
                  type: file.type
                }))}
                title=""
                variant="grid"
                onRemove={handleRemoveFile}
              />
            </Box>
          )}

          {filesByCategory.video && filesByCategory.video.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Videos ({filesByCategory.video.length})
              </Typography>
              <Grid container spacing={2}>
                {filesByCategory.video.map((file) => (
                  <Grid item xs={12} md={6} key={file.id}>
                    <Card>
                      <VideoPlayer src={file.url} title={file.name} />
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" noWrap>
                              {file.name}
                            </Typography>
                            <Chip label={formatFileSize(file.size)} size="small" />
                          </Box>
                          <IconButton
                            onClick={() => handleRemoveFile(file.id)}
                            color="error"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {filesByCategory.audio && filesByCategory.audio.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Audio ({filesByCategory.audio.length})
              </Typography>
              <Stack spacing={2}>
                {filesByCategory.audio.map((file) => (
                  <Card key={file.id} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ flex: 1 }}>
                        <AudioPlayer src={file.url} title={file.name} />
                      </Box>
                      <Stack spacing={1} alignItems="center">
                        <Chip label={formatFileSize(file.size)} size="small" />
                        <IconButton
                          onClick={() => handleRemoveFile(file.id)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {filesByCategory.document && filesByCategory.document.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Documents ({filesByCategory.document.length})
              </Typography>
              <Grid container spacing={2}>
                {filesByCategory.document.map((file) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                    <DocumentThumbnail
                      document={{
                        id: file.id,
                        name: file.name,
                        url: file.url,
                        size: file.size,
                        type: file.type,
                        s3Key: file.s3Key,
                        metadata: file.metadata
                      }}
                      showDownload={true}
                      showRemove={true}
                      onRemove={handleRemoveFile}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <Stack direction="row" spacing={1} alignItems="center">
                {getFileIcon('image')}
                <Typography variant="body2">
                  {filesByCategory.image?.length || 0} Images
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {getFileIcon('video')}
                <Typography variant="body2">
                  {filesByCategory.video?.length || 0} Videos
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {getFileIcon('audio')}
                <Typography variant="body2">
                  {filesByCategory.audio?.length || 0} Audio
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {getFileIcon('document')}
                <Typography variant="body2">
                  {filesByCategory.document?.length || 0} Documents
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      )}
    </Box>
  );
} 
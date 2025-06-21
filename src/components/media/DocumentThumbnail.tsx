'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Description,
  PictureAsPdf,
  InsertDriveFile,
  Download,
  Delete,
} from '@mui/icons-material';

export interface DocumentData {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  s3Key?: string;
  metadata?: Record<string, unknown>;
}

interface DocumentThumbnailProps {
  document: DocumentData;
  onRemove?: (documentId: string) => void;
  showDownload?: boolean;
  showRemove?: boolean;
}

const getDocumentIcon = (type?: string, name?: string) => {
  if (type?.includes('pdf') || name?.toLowerCase().endsWith('.pdf')) {
    return <PictureAsPdf sx={{ fontSize: 48 }} color="error" />;
  }
  if (type?.includes('word') || name?.toLowerCase().match(/\.(doc|docx)$/)) {
    return <Description sx={{ fontSize: 48 }} color="primary" />;
  }
  if (type?.includes('text') || name?.toLowerCase().endsWith('.txt')) {
    return <Description sx={{ fontSize: 48 }} color="info" />;
  }
  return <InsertDriveFile sx={{ fontSize: 48 }} color="action" />;
};

const getDocumentTypeLabel = (type?: string, name?: string) => {
  if (type?.includes('pdf') || name?.toLowerCase().endsWith('.pdf')) {
    return 'PDF';
  }
  if (type?.includes('word') || name?.toLowerCase().match(/\.(doc|docx)$/)) {
    return 'Word';
  }
  if (type?.includes('text') || name?.toLowerCase().endsWith('.txt')) {
    return 'Text';
  }
  if (name?.includes('.')) {
    return name.split('.').pop()?.toUpperCase() || 'Document';
  }
  return 'Document';
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

export default function DocumentThumbnail({
  document,
  onRemove,
  showDownload = true,
  showRemove = false,
}: DocumentThumbnailProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if we're on the client side
    if (typeof window === 'undefined') return;
    
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(document.id);
    }
  };

  const handleClick = () => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;
    
    // Open document in new tab
    window.open(document.url, '_blank');
  };

  return (
    <Card 
      sx={{ 
        width: 200, 
        height: 240,
        '&:hover': { 
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardActionArea 
        onClick={handleClick}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <CardContent 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 2,
            '&:last-child': { pb: 2 }
          }}
        >
          {/* Document Icon */}
          <Box sx={{ mb: 2 }}>
            {getDocumentIcon(document.type, document.name)}
          </Box>

          {/* Document Name */}
          <Typography 
            variant="subtitle2" 
            component="h3"
            sx={{ 
              mb: 1,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              minHeight: '2.4em'
            }}
          >
            {document.name}
          </Typography>

          {/* Document Type & Size */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip 
              label={getDocumentTypeLabel(document.type, document.name)}
              size="small"
              color="primary"
              variant="outlined"
            />
            {document.size && (
              <Chip 
                label={formatFileSize(document.size)}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            {showDownload && (
              <IconButton
                size="small"
                onClick={handleDownload}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            )}
            
            {showRemove && onRemove && (
              <IconButton
                size="small"
                onClick={handleRemove}
                color="error"
                sx={{ 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 
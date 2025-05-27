'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Stack,
} from '@mui/material';
import {
  Close,
  Download,
  Image as ImageIcon,
} from '@mui/icons-material';
import { ImageData } from './ImageUpload';

interface ImageGalleryProps {
  images: ImageData[];
  title?: string;
  variant?: 'grid' | 'magazine' | 'inline';
  maxHeight?: number;
}

export default function ImageGallery({ 
  images, 
  title = "Images", 
  variant = 'grid',
  maxHeight = 300 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
  };

  const handleDownload = (image: ImageData) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    link.click();
  };

  if (!images || images.length === 0) {
    return null;
  }

  const renderGridLayout = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
      {images.map((image) => (
        <Card 
          key={image.id} 
          sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { 
              transform: 'scale(1.02)',
              boxShadow: 4 
            }
          }}
          onClick={() => handleImageClick(image)}
        >
          <CardMedia
            component="img"
            height={maxHeight / 2}
            image={image.url}
            alt={image.name}
            sx={{ objectFit: 'cover' }}
          />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography variant="caption" noWrap title={image.caption || image.name} sx={{ fontSize: '12px' }}>
              {image.caption || image.name}
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );

  const renderMagazineLayout = () => {
    if (images.length === 1) {
      // Single large image
      return (
        <Box sx={{ mb: 3 }}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.01)' }
            }}
            onClick={() => handleImageClick(images[0])}
          >
            <CardMedia
              component="img"
              height={maxHeight}
              image={images[0].url}
              alt={images[0].name}
              sx={{ objectFit: 'cover' }}
            />
            {images[0].caption && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '12px' }}>
                  {images[0].caption}
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      );
    } else if (images.length === 2) {
      // Two images side by side
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {images.map((image) => (
            <Card 
              key={image.id}
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.01)' }
              }}
              onClick={() => handleImageClick(image)}
            >
              <CardMedia
                component="img"
                height={maxHeight * 0.7}
                image={image.url}
                alt={image.name}
                sx={{ objectFit: 'cover' }}
              />
              {image.caption && (
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '12px' }}>
                    {image.caption}
                  </Typography>
                </Box>
              )}
            </Card>
          ))}
        </Box>
      );
    } else {
      // Multiple images - featured + grid
      const [featured, ...rest] = images;
      return (
        <Box sx={{ mb: 3 }}>
          {/* Featured image */}
          <Card 
            sx={{ 
              mb: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.01)' }
            }}
            onClick={() => handleImageClick(featured)}
          >
            <CardMedia
              component="img"
              height={maxHeight}
              image={featured.url}
              alt={featured.name}
              sx={{ objectFit: 'cover' }}
            />
            {featured.caption && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '12px' }}>
                  {featured.caption}
                </Typography>
              </Box>
            )}
          </Card>
          
          {/* Additional images */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
            {rest.map((image) => (
              <Card 
                key={image.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
                onClick={() => handleImageClick(image)}
              >
                <CardMedia
                  component="img"
                  height={80}
                  image={image.url}
                  alt={image.name}
                  sx={{ objectFit: 'cover' }}
                />
              </Card>
            ))}
          </Box>
        </Box>
      );
    }
  };

  const renderInlineLayout = () => (
    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
      {images.map((image) => (
        <Card 
          key={image.id}
          sx={{ 
            minWidth: 150,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}
          onClick={() => handleImageClick(image)}
        >
          <CardMedia
            component="img"
            height={100}
            image={image.url}
            alt={image.name}
            sx={{ objectFit: 'cover' }}
          />
        </Card>
      ))}
    </Stack>
  );

  return (
    <Box>
      {title && variant !== 'inline' && (
        <Typography 
          variant="subtitle2" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 2,
            ...(variant === 'magazine' && {
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1
            })
          }}
        >
          <ImageIcon fontSize="small" />
          {title} ({images.length})
        </Typography>
      )}

      {variant === 'grid' && renderGridLayout()}
      {variant === 'magazine' && renderMagazineLayout()}
      {variant === 'inline' && renderInlineLayout()}

      {/* Image Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedImage?.caption || selectedImage?.name}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          {selectedImage && (
            <Button 
              startIcon={<Download />}
              onClick={() => handleDownload(selectedImage)}
            >
              Download
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
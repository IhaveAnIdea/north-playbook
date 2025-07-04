'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Flag,
  SelfImprovement,
  Favorite,
  Visibility,
  TextFields,
  Mic,
  Videocam,
} from '@mui/icons-material';
import { PlaybookEntry } from '@/data/playbook';
import AudioPlayer from '@/components/media/AudioPlayer';
import VideoPlayer from '@/components/media/VideoPlayer';
import ImageGallery from '@/components/media/ImageGallery';
import DocumentThumbnail from '@/components/media/DocumentThumbnail';

const categoryIcons = {
  mindset: Psychology,
  motivation: TrendingUp,
  goals: Flag,
  reflection: SelfImprovement,
  gratitude: Favorite,
  vision: Visibility,
};

const categoryColors = {
  mindset: 'primary',
  motivation: 'secondary',
  goals: 'success',
  reflection: 'info',
  gratitude: 'error',
  vision: 'warning',
} as const;

const moodColors = {
  positive: 'success',
  motivated: 'primary',
  reflective: 'info',
  neutral: 'default',
} as const;

const responseTypeIcons = {
  text: TextFields,
  audio: Mic,
  video: Videocam,
};

interface PlaybookEntryProps {
  entry: PlaybookEntry;
  showFullResponse?: boolean;
}

export default function PlaybookEntryComponent({ entry, showFullResponse = true }: PlaybookEntryProps) {
  const [mounted, setMounted] = useState(false);
  const CategoryIcon = categoryIcons[entry.category as keyof typeof categoryIcons] || SelfImprovement;
  const ResponseIcon = responseTypeIcons[entry.responseType];

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const formatDate = (date: Date) => {
    if (!mounted) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateResponse = (response: string, maxLength: number = 200) => {
    if (response.length <= maxLength) return response;
    return response.substring(0, maxLength) + '...';
  };

  return (
    <Card sx={{ mb: 3, '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: `${categoryColors[entry.category as keyof typeof categoryColors]}.main`,
                color: 'white',
              }}
            >
              <CategoryIcon />
            </Box>
            <Box>
              <Typography variant="h6" component="h3" gutterBottom>
                {entry.exerciseTitle}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={entry.category}
                  size="small"
                  color={categoryColors[entry.category as keyof typeof categoryColors]}
                />
                <Chip
                  icon={<ResponseIcon />}
                  label={entry.responseType}
                  size="small"
                  variant="outlined"
                />
                {entry.mood && (
                  <Chip
                    label={entry.mood}
                    size="small"
                    color={moodColors[entry.mood as keyof typeof moodColors]}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatDate(entry.completedAt)}
          </Typography>
        </Box>

        {/* Response */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Your Response:
          </Typography>
          
          {entry.responseType === 'text' ? (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, borderLeft: 4, borderColor: 'primary.main' }}>
              <div 
                className="rich-text-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: showFullResponse ? entry.response : truncateResponse(entry.response)
                }}
              />
            </Box>
          ) : entry.responseType === 'audio' ? (
            <Box sx={{ mb: 2 }}>
              {/* Audio Files */}
              {entry.audioFiles && entry.audioFiles.length > 0 && (
                <Stack spacing={2} sx={{ mb: 2 }}>
                  {entry.audioFiles.map((audio) => (
                    <AudioPlayer 
                      key={audio.id}
                      src={audio.url}
                      title={audio.name}
                    />
                  ))}
                </Stack>
              )}
              
              {/* Response Text */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, borderLeft: 4, borderColor: 'primary.main' }}>
                <div 
                  className="rich-text-content prose prose-sm max-w-none text-sm italic"
                  dangerouslySetInnerHTML={{ __html: entry.response }}
                />
              </Box>
            </Box>
          ) : entry.responseType === 'video' ? (
            <Box sx={{ mb: 2 }}>
              {/* Videos */}
              {entry.videos && entry.videos.length > 0 && (
                <Stack spacing={2} sx={{ mb: 2 }}>
                  {entry.videos.map((video) => (
                    <VideoPlayer 
                      key={video.id}
                      src={video.url}
                      title={video.name}
                    />
                  ))}
                </Stack>
              )}
              
              {/* Response Text */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, borderLeft: 4, borderColor: 'primary.main' }}>
                <div 
                  className="rich-text-content prose prose-sm max-w-none text-sm italic"
                  dangerouslySetInnerHTML={{ __html: entry.response }}
                />
              </Box>
            </Box>
          ) : null}
        </Box>

        {/* Images */}
        {entry.images && entry.images.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <ImageGallery 
              images={entry.images} 
              title="Images"
              variant="grid"
              maxHeight={200}
            />
          </Box>
        )}

        {/* Documents */}
        {entry.documents && entry.documents.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Documents:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
              {entry.documents.map((document) => (
                <DocumentThumbnail
                  key={document.id}
                  document={document}
                  showDownload={true}
                  showRemove={false}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Insights */}
        {entry.insights && entry.insights.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                AI Insights:
              </Typography>
              <Stack spacing={1}>
                {entry.insights.map((insight, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mt: 1,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {insight}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {entry.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 
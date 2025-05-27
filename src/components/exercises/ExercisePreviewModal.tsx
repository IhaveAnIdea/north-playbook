'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import { Exercise, categoryIcons, categoryColors } from '@/data/exercises';
import Link from 'next/link';

interface ExercisePreviewModalProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
}

export default function ExercisePreviewModal({ exercise, open, onClose }: ExercisePreviewModalProps) {
  if (!exercise) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${categoryColors[exercise.category as keyof typeof categoryColors]}.main`,
              color: 'white',
            }}
          >
            {React.createElement(categoryIcons[exercise.category as keyof typeof categoryIcons])}
          </Box>
          <Box>
            <Typography variant="h5" component="h2">
              {exercise.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                label={exercise.category}
                size="small"
                color={categoryColors[exercise.category as keyof typeof categoryColors]}
              />
              <Chip
                label={exercise.promptType}
                size="small"
                variant="outlined"
              />
              <Chip
                label={exercise.estimatedTime}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {exercise.description}
        </Typography>
        
        <Box sx={{ p: 3, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            Exercise Question:
          </Typography>
          <Typography variant="body1">
            {exercise.question}
          </Typography>
        </Box>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Response Type:</strong> {exercise.promptType === 'text' ? 'Written response' : exercise.promptType === 'audio' ? 'Audio recording' : 'Video recording'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Estimated Time:</strong> {exercise.estimatedTime}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          component={Link}
          href={`/exercises/${exercise.id}`}
          variant="contained"
          onClick={onClose}
        >
          Start Exercise
        </Button>
      </DialogActions>
    </Dialog>
  );
} 
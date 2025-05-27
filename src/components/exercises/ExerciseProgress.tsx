'use client';

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import { CheckCircle, Schedule, TrendingUp } from '@mui/icons-material';
import { exercises } from '@/data/exercises';

interface ExerciseProgressProps {
  completedExerciseIds?: string[];
}

export default function ExerciseProgress({ completedExerciseIds = [] }: ExerciseProgressProps) {
  const totalExercises = exercises.length;
  const completedCount = completedExerciseIds.length;
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  // Calculate category progress
  const categoryProgress = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = { total: 0, completed: 0 };
    }
    acc[exercise.category].total++;
    if (completedExerciseIds.includes(exercise.id)) {
      acc[exercise.category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" />
          Your Progress
        </Typography>

        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount} of {totalExercises} exercises
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {Math.round(progressPercentage)}% Complete
          </Typography>
        </Box>

        {/* Category Progress */}
        <Typography variant="subtitle2" gutterBottom>
          Progress by Category
        </Typography>
        <Stack spacing={2}>
          {Object.entries(categoryProgress).map(([category, progress]) => {
            const categoryPercentage = (progress.completed / progress.total) * 100;
            return (
              <Box key={category}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {progress.completed}/{progress.total}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={categoryPercentage}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            );
          })}
        </Stack>

        {/* Quick Stats */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="h6" color="success.main">
                  {completedCount}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Schedule color="warning" fontSize="small" />
                <Typography variant="h6" color="warning.main">
                  {totalExercises - completedCount}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
} 
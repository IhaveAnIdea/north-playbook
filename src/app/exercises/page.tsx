'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { exercises, categoryIcons, categoryColors, categories, Exercise } from '@/data/exercises';
import ExercisePreviewModal from '@/components/exercises/ExercisePreviewModal';
import ExerciseProgress from '@/components/exercises/ExerciseProgress';

export default function ExercisesPage() {  useAuthenticator((context) => [context.user]);  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(exercise => exercise.category === selectedCategory);

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  const handlePreviewClick = (exercise: Exercise) => {
    setPreviewExercise(exercise);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewExercise(null);
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Personal Development Exercises
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Choose an exercise to begin your journey of self-discovery and growth.
          </Typography>
        </Box>

        {/* Progress Section */}
        <Box sx={{ mb: 4 }}>
          <ExerciseProgress completedExerciseIds={['1', '3']} />
        </Box>

        {/* Category Tabs */}
        <Box sx={{ mb: 4 }}>
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {categories.map((category) => (
              <Tab
                key={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                value={category}
              />
            ))}
          </Tabs>
        </Box>

        {/* Exercises Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: `${categoryColors[exercise.category as keyof typeof categoryColors]}.main`,
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {React.createElement(categoryIcons[exercise.category as keyof typeof categoryIcons])}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h3" gutterBottom>
                      {exercise.title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
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

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                  {exercise.description}
                </Typography>

                <Box sx={{ mt: 'auto' }}>
                  <Button
                    variant="contained"
                    component={Link}
                    href={`/exercises/${exercise.id}`}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Start Exercise
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={() => handlePreviewClick(exercise)}
                  >
                    Preview Question
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {filteredExercises.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No exercises found in this category.
            </Typography>
          </Box>
        )}

        <ExercisePreviewModal
          exercise={previewExercise}
          open={previewOpen}
          onClose={handlePreviewClose}
        />
      </Container>
    </>
  );
} 
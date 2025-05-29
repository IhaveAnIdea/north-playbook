'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  LibraryBooks,
  CalendarToday,
  Timeline,
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { samplePlaybookEntries, generatePlaybookSections } from '@/data/playbook';

export default function ProgressPage() {
  const [mounted, setMounted] = useState(false);
  const sections = generatePlaybookSections(samplePlaybookEntries);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate progress metrics
  const calculateProgress = () => {
    const totalEntries = samplePlaybookEntries.length;
    const categoriesActive = sections.length;
    const totalCategories = 6; // mindset, motivation, goals, reflection, gratitude, vision
    
    // Calculate category completion percentages
    const categoryProgress = sections.map(section => ({
      ...section,
      completionRate: Math.min((section.entries.length / 5) * 100, 100) // Assume 5 entries = 100%
    }));

    // Only calculate time-based metrics after mounting to avoid hydration issues
    let weeklyEntries = 0;
    let monthlyEntries = 0;
    
    if (mounted) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      weeklyEntries = samplePlaybookEntries.filter(entry => 
        entry.completedAt >= oneWeekAgo
      ).length;

      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      monthlyEntries = samplePlaybookEntries.filter(entry => 
        entry.completedAt >= oneMonthAgo
      ).length;
    }

    return {
      totalEntries,
      categoriesActive,
      totalCategories,
      categoryProgress,
      weeklyEntries,
      monthlyEntries,
      overallProgress: Math.min((totalEntries / 20) * 100, 100) // Assume 20 entries = 100%
    };
  };

  const progress = calculateProgress();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h3" component="h1">
              Progress Tracking
            </Typography>
          </Stack>
          <Typography variant="h6" color="text.secondary">
            Monitor your personal development journey and growth over time
          </Typography>
        </Box>

        {/* Overall Progress */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Overall Progress
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Development Journey
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progress.overallProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress.overallProgress} 
                color={getProgressColor(progress.overallProgress)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              You&apos;ve completed {progress.totalEntries} entries across {progress.categoriesActive} categories. 
              Keep up the great work!
            </Typography>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {progress.totalEntries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Entries
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <LibraryBooks sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                {progress.categoriesActive}/{progress.totalCategories}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories Active
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <CalendarToday sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {progress.weeklyEntries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {progress.monthlyEntries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Month
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Category Progress */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Category Progress
            </Typography>
            <Stack spacing={3}>
              {progress.categoryProgress.map((category) => (
                <Box key={category.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">
                        {category.title}
                      </Typography>
                      <Chip 
                        label={`${category.entries.length} entries`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(category.completionRate)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={category.completionRate} 
                    color={getProgressColor(category.completionRate)}
                    sx={{ height: 6, borderRadius: 3, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Recent Activity
            </Typography>
            <Stack spacing={2}>
              {samplePlaybookEntries
                .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
                .slice(0, 5)
                .map((entry) => (
                  <Box 
                    key={entry.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {entry.exerciseTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip label={entry.category} size="small" />
                        <Chip label={entry.responseType} size="small" variant="outlined" />
                        {entry.mood && <Chip label={entry.mood} size="small" variant="outlined" />}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {entry.completedAt.toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
} 
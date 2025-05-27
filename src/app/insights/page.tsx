'use client';

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  Divider,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import {
  Psychology,
  AutoAwesome,
  TrendingUp,
  Lightbulb,
  Insights,
  Refresh,
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { samplePlaybookEntries, generatePlaybookSections } from '@/data/playbook';

export default function InsightsPage() {
  const sections = generatePlaybookSections(samplePlaybookEntries);

  // Generate AI insights based on user data
  const generateInsights = () => {
    const totalEntries = samplePlaybookEntries.length;
    const categories = sections.map(s => s.id);
    const moods = samplePlaybookEntries.map(e => e.mood).filter(Boolean);
    const responseTypes = samplePlaybookEntries.map(e => e.responseType);
    
    // Most active category
    const mostActiveCategory = sections.reduce((prev, current) => 
      prev.entries.length > current.entries.length ? prev : current
    );

    // Mood analysis
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood!] = (acc[mood!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const dominantMood = Object.entries(moodCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Response type preference
    const typeCounts = responseTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const preferredType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      totalEntries,
      categories,
      mostActiveCategory,
      dominantMood,
      preferredType,
      insights: [
        {
          type: 'strength',
          title: 'Your Development Strength',
          content: `You show strong engagement in ${mostActiveCategory.title.toLowerCase()} with ${mostActiveCategory.entries.length} entries. This suggests you have a natural inclination toward ${mostActiveCategory.description.toLowerCase()}`,
          icon: TrendingUp,
          color: 'success.main'
        },
        {
          type: 'pattern',
          title: 'Emotional Pattern',
          content: `Your entries predominantly reflect a ${dominantMood} mood, indicating ${dominantMood === 'positive' ? 'an optimistic outlook and growth mindset' : dominantMood === 'motivated' ? 'high drive and ambition' : 'thoughtful introspection and self-awareness'}.`,
          icon: Psychology,
          color: 'primary.main'
        },
        {
          type: 'preference',
          title: 'Learning Style',
          content: `You prefer ${preferredType} responses, which suggests you learn best through ${preferredType === 'text' ? 'written reflection and structured thinking' : preferredType === 'audio' ? 'verbal processing and auditory learning' : 'visual and multimedia engagement'}.`,
          icon: Lightbulb,
          color: 'warning.main'
        },
        {
          type: 'recommendation',
          title: 'Growth Opportunity',
          content: `Consider exploring ${categories.length < 6 ? 'new categories like vision or motivation exercises' : 'deeper reflection in your less active categories'} to create a more balanced development approach.`,
          icon: AutoAwesome,
          color: 'secondary.main'
        }
      ]
    };
  };

  const insights = generateInsights();

  const personalizedRecommendations = [
    {
      title: 'Weekly Reflection Ritual',
      description: 'Based on your consistent engagement, establish a weekly reflection practice to deepen your insights.',
      action: 'Set up weekly reminders',
      priority: 'high'
    },
    {
      title: 'Explore New Categories',
      description: 'Branch out into vision and motivation exercises to create a more holistic development approach.',
      action: 'Try a vision exercise',
      priority: 'medium'
    },
    {
      title: 'Share Your Journey',
      description: 'Your thoughtful responses could inspire others. Consider sharing selected insights.',
      action: 'Export your playbook',
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h3" component="h1">
              AI Insights
            </Typography>
          </Stack>
          <Typography variant="h6" color="text.secondary">
            Personalized analysis and recommendations based on your development journey
          </Typography>
        </Box>

        {/* Overview Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Insights sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {insights.insights.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI Insights Generated
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <AutoAwesome sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                {insights.categories.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categories Analyzed
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {insights.totalEntries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data Points Processed
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* AI Insights */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                Personalized Insights
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                size="small"
              >
                Regenerate
              </Button>
            </Box>
            
            <Stack spacing={3}>
              {insights.insights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <Box key={index} sx={{ display: 'flex', gap: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 60,
                      height: 60
                    }}>
                      <IconComponent sx={{ fontSize: 32, color: insight.color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: insight.color }}>
                        {insight.title}
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {insight.content}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Personalized Recommendations
            </Typography>
            <Stack spacing={3}>
              {personalizedRecommendations.map((rec, index) => (
                <Box key={index} sx={{ 
                  p: 3, 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.50' }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">
                      {rec.title}
                    </Typography>
                                         <Chip 
                       label={rec.priority.toUpperCase()} 
                       size="small" 
                       color={getPriorityColor(rec.priority) as 'error' | 'warning' | 'info' | 'default'}
                     />
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {rec.description}
                  </Typography>
                  <Button variant="outlined" size="small">
                    {rec.action}
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Category Deep Dive */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Category Analysis
            </Typography>
            <Stack spacing={3}>
              {sections.map((section) => (
                <Box key={section.id}>
                  <Typography variant="h6" gutterBottom>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {section.description}
                  </Typography>
                  
                  {section.insights.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI Analysis:
                      </Typography>
                      <Stack spacing={1}>
                        {section.insights.map((insight, index) => (
                          <Typography key={index} variant="body2">
                            • {insight}
                          </Typography>
                        ))}
                      </Stack>
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${section.entries.length} entries`} size="small" />
                    {section.entries.map(entry => entry.mood).filter(Boolean).length > 0 && (
                      <Chip 
                        label={`Mood: ${section.entries.map(e => e.mood).filter(Boolean)[0]}`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  {section !== sections[sections.length - 1] && <Divider sx={{ mt: 3 }} />}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
} 
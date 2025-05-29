'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Chip,
  Divider,
  Container,
  Card,
  CardMedia,
  Avatar,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Psychology,
  TrendingUp,
  Flag,
  SelfImprovement,
  Favorite,
  Visibility,
  FormatQuote,
  CalendarToday,
} from '@mui/icons-material';
import { PlaybookSection, PlaybookEntry } from '@/data/playbook';
import AudioPlayer from '@/components/media/AudioPlayer';
import VideoPlayer from '@/components/media/VideoPlayer';
import ImageGallery from '@/components/media/ImageGallery';

const categoryIcons = {
  mindset: Psychology,
  motivation: TrendingUp,
  goals: Flag,
  reflection: SelfImprovement,
  gratitude: Favorite,
  vision: Visibility,
};

const categoryColors = {
  mindset: '#1976d2',
  motivation: '#9c27b0',
  goals: '#2e7d32',
  reflection: '#0288d1',
  gratitude: '#d32f2f',
  vision: '#ed6c02',
};

interface MagazineLayoutProps {
  sections: PlaybookSection[];
  userName?: string;
  userDisplayName?: string;
}

interface MagazinePage {
  type: 'cover' | 'section-intro' | 'entry' | 'insights';
  content?: PlaybookEntry;
  section?: PlaybookSection;
  userName?: string;
}

export default function MagazineLayout({ sections, userName = 'Your', userDisplayName }: MagazineLayoutProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate magazine pages with flowing content
  const generatePages = (): MagazinePage[] => {
    const pages: MagazinePage[] = [];
    
    // Cover page
    pages.push({ type: 'cover', userName });
    
    // Create magazine-style spreads
    sections.forEach((section) => {
      // Section feature page (like magazine article opener)
      pages.push({ type: 'section-intro', section });
      
      // Entry pages
      section.entries.forEach(entry => {
        pages.push({ type: 'entry', content: entry, section });
      });
      
      // Section insights as magazine feature
      if (section.insights.length > 0) {
        pages.push({ type: 'insights', section });
      }
    });
    
    return pages;
  };

  const pages = generatePages();
  const totalPages = pages.length;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (date: Date) => {
    if (!mounted) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderCoverPage = (page: MagazinePage) => {
    // Get featured images from entries for background
    const allImages = sections.flatMap(section => 
      section.entries.flatMap(entry => entry.images || [])
    );
    const backgroundImages = allImages.slice(0, 4);
    
    return (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '14px',
        textAlign: 'left',
      }}
    >
      {/* Magazine Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
            PERSONAL DEVELOPMENT
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {mounted ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : ''}
          </Typography>
        </Box>
      </Box>

      {/* Background Images */}
      {backgroundImages.length > 0 && (
        <>
          {/* Top Right Image */}
          {backgroundImages[0] && (
            <Box
              sx={{
                position: 'absolute',
                top: '15%',
                right: '5%',
                width: '200px',
                height: '150px',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transform: 'rotate(8deg)',
                zIndex: 1,
                border: '3px solid white',
              }}
            >
              <Image
                src={backgroundImages[0].url}
                alt={backgroundImages[0].caption || backgroundImages[0].name}
                fill
                style={{
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
          
          {/* Bottom Left Image */}
          {backgroundImages[1] && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '20%',
                left: '8%',
                width: '180px',
                height: '120px',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transform: 'rotate(-5deg)',
                zIndex: 1,
                border: '3px solid white',
              }}
            >
              <Image
                src={backgroundImages[1].url}
                alt={backgroundImages[1].caption || backgroundImages[1].name}
                fill
                style={{
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
          
          {/* Center Right Small Image */}
          {backgroundImages[2] && (
            <Box
              sx={{
                position: 'absolute',
                top: '45%',
                right: '15%',
                width: '120px',
                height: '90px',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transform: 'rotate(-12deg)',
                zIndex: 1,
                border: '2px solid white',
              }}
            >
              <Image
                src={backgroundImages[2].url}
                alt={backgroundImages[2].caption || backgroundImages[2].name}
                fill
                style={{
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
          
          {/* Bottom Right Corner Image */}
          {backgroundImages[3] && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '8%',
                right: '3%',
                width: '140px',
                height: '100px',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transform: 'rotate(15deg)',
                zIndex: 1,
                border: '2px solid white',
              }}
            >
              <Image
                src={backgroundImages[3].url}
                alt={backgroundImages[3].caption || backgroundImages[3].name}
                fill
                style={{
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Main Cover Content */}
      <Box sx={{ 
        flex: 1, 
        p: 6, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        fontSize: '14px',
        textAlign: 'left'
      }}>
        {/* Feature Story Badge */}
        <Box sx={{ mb: 4 }}>
          <Chip 
            label="FEATURE STORY" 
            sx={{ 
              bgcolor: '#ff6b35', 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: '0.75rem',
              letterSpacing: 1
            }} 
          />
        </Box>

        {/* Main Headline */}
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontWeight: 900,
            fontSize: { xs: '3rem', md: '4.5rem' },
            lineHeight: 0.9,
            mb: 3,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {(userDisplayName || page.userName || 'YOUR').toUpperCase()}&apos;S
        </Typography>
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontWeight: 900,
            fontSize: { xs: '2.5rem', md: '4rem' },
            lineHeight: 0.9,
            mb: 2,
            color: '#ff6b35',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          TRANSFORMATION
        </Typography>
        <Typography 
          variant="h2" 
          component="h2" 
          sx={{ 
            fontWeight: 300,
            fontSize: { xs: '1.5rem', md: '2rem' },
            mb: 4,
            opacity: 0.9,
            fontStyle: 'italic'
          }}
        >
          A Journey of Growth and Self-Discovery
        </Typography>

        {/* Cover Stories */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#ff6b35' }}>
            INSIDE THIS ISSUE:
          </Typography>
          <Stack spacing={1}>
            {sections.slice(0, 4).map((section) => (
              <Typography key={section.id} variant="body1" sx={{ opacity: 0.9 }}>
                • {section.title}: {section.entries.length} Breakthrough Moments
              </Typography>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Magazine Footer */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            VOLUME 1 • ISSUE 1
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {sections.reduce((total, section) => total + section.entries.length, 0)} STORIES
          </Typography>
        </Box>
      </Box>

      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '40%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
    </Box>
    );
  };

  const renderSectionIntro = (page: MagazinePage) => {
    const section = page.section!;
    const CategoryIcon = categoryIcons[section.id as keyof typeof categoryIcons] || SelfImprovement;
    const categoryColor = categoryColors[section.id as keyof typeof categoryColors] || '#1976d2';

    return (
      <Box sx={{ height: '100%', p: 6, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: categoryColor,
                color: 'white',
              }}
            >
              <CategoryIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', color: categoryColor }}>
              {section.title}
            </Typography>
          </Box>
          
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6, fontSize: '14px', textAlign: 'left' }}>
            {section.description}
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 6 }}>
          <Paper sx={{ p: 4, bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={4} justifyContent="center">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: categoryColor }}>
                  {section.entries.length}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Entries
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: categoryColor }}>
                  {section.insights.length}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Insights
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Preview insights */}
        {section.insights.length > 0 && (
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ color: categoryColor }}>
              Key Insights Preview
            </Typography>
            <Stack spacing={2}>
              {section.insights.slice(0, 3).map((insight, insightIndex) => (
                <Box key={insightIndex} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: categoryColor,
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '14px', textAlign: 'left' }}>
                    {insight}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  const renderEntryPage = (page: MagazinePage) => {
    const entry = page.content!;
    const section = page.section!;
    const CategoryIcon = categoryIcons[section.id as keyof typeof categoryIcons] || SelfImprovement;
    const categoryColor = categoryColors[section.id as keyof typeof categoryColors] || '#1976d2';

    return (
      <Box sx={{ height: '100%', bgcolor: '#fafafa' }}>
        {/* Magazine Header */}
        <Box sx={{ 
          p: 3, 
          bgcolor: 'white', 
          borderBottom: '3px solid',
          borderColor: categoryColor,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CategoryIcon sx={{ color: categoryColor, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: categoryColor, letterSpacing: 1 }}>
              {section.title.toUpperCase()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              {formatDate(entry.completedAt).toUpperCase()}
            </Typography>
          </Box>
        </Box>

        {/* Magazine Layout with Flexbox */}
        <Box sx={{ display: 'flex', height: 'calc(100% - 80px)', overflow: 'hidden' }}>
          {/* Main Article Column */}
          <Box sx={{ flex: 2, p: 4, overflowY: 'auto', height: '100%' }}>
            {/* Article Header */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 900,
                  lineHeight: 1.1,
                  mb: 2,
                  color: '#1a1a1a'
                }}
              >
                {entry.exerciseTitle}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: categoryColor, width: 32, height: 32 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {entry.responseType.charAt(0).toUpperCase()}
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Personal Reflection
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entry.responseType.toUpperCase()} RESPONSE
                  </Typography>
                </Box>
                {entry.mood && (
                  <Chip 
                    label={entry.mood} 
                    size="small" 
                    sx={{ 
                      bgcolor: `${categoryColor}20`,
                      color: categoryColor,
                      fontWeight: 'bold'
                    }} 
                  />
                )}
              </Box>
            </Box>

            {/* Article Content */}
            <Box sx={{ mb: 4 }}>
              {entry.responseType === 'text' ? (
                <Box>
                  {/* Drop Cap Effect */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '14px',
                      lineHeight: 1.8,
                      textAlign: 'left',
                      columnCount: { md: 2 },
                      columnGap: 4,
                      columnRule: '1px solid #e0e0e0',
                      '&::first-letter': {
                        fontSize: '4rem',
                        fontWeight: 'bold',
                        float: 'left',
                        lineHeight: 1,
                        marginRight: '8px',
                        marginTop: '4px',
                        color: categoryColor
                      }
                    }}
                  >
                    {entry.response}
                  </Typography>
                </Box>
              ) : entry.responseType === 'audio' ? (
                <Box>
                  <Card sx={{ mb: 3, overflow: 'hidden' }}>
                    <CardMedia sx={{ p: 3, bgcolor: `${categoryColor}10` }}>
                      <AudioPlayer 
                        src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
                        title={`Audio response for ${entry.exerciseTitle}`}
                      />
                    </CardMedia>
                  </Card>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '14px',
                      lineHeight: 1.8,
                      fontStyle: 'italic',
                      textAlign: 'left',
                      columnCount: { md: 2 },
                      columnGap: 4,
                      columnRule: '1px solid #e0e0e0'
                    }}
                  >
                    {entry.response}
                  </Typography>
                </Box>
              ) : entry.responseType === 'video' ? (
                <Box>
                  <Card sx={{ mb: 3, overflow: 'hidden' }}>
                    <CardMedia sx={{ p: 2, bgcolor: '#000' }}>
                      <VideoPlayer 
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        title={`Video response for ${entry.exerciseTitle}`}
                      />
                    </CardMedia>
                  </Card>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '14px',
                      lineHeight: 1.8,
                      fontStyle: 'italic',
                      textAlign: 'left',
                      columnCount: { md: 2 },
                      columnGap: 4,
                      columnRule: '1px solid #e0e0e0'
                    }}
                  >
                    {entry.response}
                  </Typography>
                </Box>
              ) : null}
            </Box>

            {/* Images in Magazine Style */}
            {entry.images && entry.images.length > 0 && (
              <Box sx={{ mt: 4, mb: 4 }}>
                <ImageGallery 
                  images={entry.images} 
                  title="Visual Elements"
                  variant="magazine"
                  maxHeight={250}
                />
              </Box>
            )}

            {/* Tags as Magazine Keywords */}
            {entry.tags && entry.tags.length > 0 && (
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: categoryColor }}>
                  KEYWORDS:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {entry.tags.map((tag, tagIndex) => (
                    <Typography
                      key={tagIndex}
                      variant="caption"
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 1
                      }}
                    >
                      {tag}
                      {tagIndex < entry.tags!.length - 1 && ' • '}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: 1, bgcolor: 'white', p: 4, borderLeft: '1px solid #e0e0e0', overflowY: 'auto', height: '100%' }}>
            {/* Insights Sidebar */}
            {entry.insights && entry.insights.length > 0 && (
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 3,
                    color: categoryColor,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    borderBottom: `2px solid ${categoryColor}`,
                    pb: 1
                  }}
                >
                  Key Insights
                </Typography>
                
                <Stack spacing={3}>
                  {entry.insights.map((insight, insightIndex) => (
                    <Box key={insightIndex}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <FormatQuote sx={{ color: categoryColor, fontSize: 20, mt: 0.5 }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            lineHeight: 1.6,
                            fontStyle: 'italic',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          {insight}
                        </Typography>
                      </Box>
                      {insightIndex < entry.insights!.length - 1 && (
                        <Divider sx={{ mt: 2, opacity: 0.3 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Section Info Box */}
            <Box sx={{ mt: 4, p: 3, bgcolor: `${categoryColor}08`, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: categoryColor }}>
                ABOUT THIS SECTION
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2, fontSize: '14px', textAlign: 'left' }}>
                {section.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {section.entries.length} total entries in {section.title}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderInsightsPage = (page: MagazinePage) => {
    const section = page.section!;
    const categoryColor = categoryColors[section.id as keyof typeof categoryColors] || '#1976d2';

    return (
      <Box sx={{ height: '100%', p: 6, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: categoryColor, mb: 4 }}>
          {section.title} Insights
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
          Key patterns and discoveries from your {section.title.toLowerCase()} journey
        </Typography>

        <Stack spacing={4} sx={{ flex: 1 }}>
          {section.insights.map((insight, insightIndex) => (
            <Paper key={insightIndex} sx={{ p: 4, bgcolor: `${categoryColor}08`, borderLeft: 4, borderColor: categoryColor }}>
              <Typography variant="h6" gutterBottom sx={{ color: categoryColor }}>
                Insight #{insightIndex + 1}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '14px', lineHeight: 1.7, textAlign: 'left' }}>
                {insight}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    );
  };

  const renderPage = (page: MagazinePage) => {
    switch (page.type) {
      case 'cover':
        return renderCoverPage(page);
      case 'section-intro':
        return renderSectionIntro(page);
      case 'entry':
        return renderEntryPage(page);
      case 'insights':
        return renderInsightsPage(page);
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, fontSize: '14px', textAlign: 'left' }}>
      <Box sx={{ position: 'relative', height: '90vh', minHeight: '800px' }}>
        {/* Magazine Page */}
        <Paper
          ref={containerRef}
          sx={{
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            borderRadius: 2,
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            },
          }}
        >
          {renderPage(pages[currentPage])}
        </Paper>

        {/* Navigation */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'white',
            p: 2,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <IconButton 
            onClick={prevPage} 
            disabled={currentPage === 0}
            sx={{ 
              bgcolor: currentPage === 0 ? 'grey.100' : 'primary.main',
              color: currentPage === 0 ? 'grey.400' : 'white',
              '&:hover': {
                bgcolor: currentPage === 0 ? 'grey.100' : 'primary.dark',
              },
            }}
          >
            <ChevronLeft />
          </IconButton>
          
          <Typography variant="body2" sx={{ mx: 2, minWidth: '80px', textAlign: 'center' }}>
            {currentPage + 1} of {totalPages}
          </Typography>
          
          <IconButton 
            onClick={nextPage} 
            disabled={currentPage === totalPages - 1}
            sx={{ 
              bgcolor: currentPage === totalPages - 1 ? 'grey.100' : 'primary.main',
              color: currentPage === totalPages - 1 ? 'grey.400' : 'white',
              '&:hover': {
                bgcolor: currentPage === totalPages - 1 ? 'grey.100' : 'primary.dark',
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>
    </Container>
  );
} 
'use client';

import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Chip,
  Card,
  CardMedia,
  Link,
} from '@mui/material';
import { 
  GetApp, 
  AudioFile, 
  VideoFile, 
  Image as ImageIcon,
  OpenInNew 
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { PlaybookSection, PlaybookEntry } from '@/data/playbook';

interface PlaybookPDFProps {
  sections: PlaybookSection[];
  entries?: PlaybookEntry[];
  userName?: string;
  viewMode?: 'timeline' | 'categories' | 'magazine';
  userDisplayName?: string;
}

interface PrintablePlaybookProps {
  sections: PlaybookSection[];
  entries?: PlaybookEntry[];
  userName?: string;
  viewMode?: 'timeline' | 'categories' | 'magazine';
  userDisplayName?: string;
}

const PrintablePlaybook = React.forwardRef<HTMLDivElement, PrintablePlaybookProps>(
  ({ sections, entries, userName = 'Your', viewMode = 'categories', userDisplayName }, ref) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const renderMediaElement = (entry: PlaybookEntry) => {
      if (entry.responseType === 'audio') {
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            bgcolor: '#f0f8ff', 
            borderRadius: 1, 
            border: '1px solid #1976d2',
            mb: 2 
          }}>
            <AudioFile sx={{ color: '#1976d2', fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Audio Response
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click to listen: {entry.exerciseTitle}
              </Typography>
              <Link 
                href="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.875rem' }}
              >
                Open Audio <OpenInNew sx={{ fontSize: 16 }} />
              </Link>
            </Box>
          </Box>
        );
      } else if (entry.responseType === 'video') {
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            bgcolor: '#fff8f0', 
            borderRadius: 1, 
            border: '1px solid #ff6b35',
            mb: 2 
          }}>
            <VideoFile sx={{ color: '#ff6b35', fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Video Response
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click to watch: {entry.exerciseTitle}
              </Typography>
              <Link 
                href="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.875rem' }}
              >
                Open Video <OpenInNew sx={{ fontSize: 16 }} />
              </Link>
            </Box>
          </Box>
        );
      }
      return null;
    };

    const renderImages = (entry: PlaybookEntry) => {
      if (!entry.images || entry.images.length === 0) return null;

      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon sx={{ fontSize: 18 }} />
            Images ({entry.images.length})
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: entry.images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 2 
          }}>
            {entry.images.map((image) => (
              <Card key={image.id} sx={{ maxWidth: 300 }}>
                <CardMedia
                  component="img"
                  height={entry.images!.length === 1 ? 200 : 120}
                  image={image.url}
                  alt={image.name}
                  sx={{ objectFit: 'cover' }}
                />
                {image.caption && (
                  <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                      {image.caption}
                    </Typography>
                  </Box>
                )}
              </Card>
            ))}
          </Box>
        </Box>
      );
    };

    // Determine which entries to show based on view mode
    const getEntriesToShow = () => {
      if (viewMode === 'timeline' && entries) {
        return entries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      }
      return null; // Use sections for category view
    };

    const totalEntries = entries ? entries.length : sections.reduce((sum, section) => sum + section.entries.length, 0);
    const displayName = userDisplayName || userName;

    if (!mounted) {
      return <Box ref={ref} sx={{ p: 4 }}>Loading...</Box>;
    }

    return (
      <Box ref={ref} sx={{ p: 4, bgcolor: 'white', color: 'black' }}>
        {/* Cover Page */}
        <Box sx={{ textAlign: 'center', mb: 6, minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            {displayName} Personal Development Playbook
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            A Journey of Growth and Self-Discovery
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generated on {mounted ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {totalEntries} entries across {sections.length} categories
          </Typography>
        </Box>

        <div style={{ pageBreakBefore: 'always' }}>
          {/* Table of Contents */}
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Table of Contents
          </Typography>
          
          {sections.map((section, index) => (
            <Box key={section.id} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {index + 1}. {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {section.entries.length} entries
              </Typography>
            </Box>
          ))}
          
          <Divider sx={{ my: 4 }} />
          
          {/* Summary Insights */}
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Key Insights Summary
          </Typography>
          
          {sections.map((section) => (
            <Box key={`summary-${section.id}`} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {section.description}
              </Typography>
              {section.insights.length > 0 && (
                <Stack spacing={1}>
                  {section.insights.map((insight, index) => (
                    <Typography key={index} variant="body2" sx={{ pl: 2, borderLeft: 2, borderColor: '#1976d2' }}>
                      • {insight}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
          ))}
        </div>

        {/* Content based on view mode */}
        {viewMode === 'timeline' && getEntriesToShow() ? (
          <div style={{ pageBreakBefore: 'always' }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 4 }}>
              Timeline View - Your Journey
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your personal development entries in chronological order, showing your growth over time.
            </Typography>

            {getEntriesToShow()!.map((entry, entryIndex) => (
              <Box key={entry.id} sx={{ mb: 4, pb: 3, borderBottom: entryIndex < getEntriesToShow()!.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {entry.exerciseTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(entry.completedAt)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Chip label={entry.category} size="small" />
                  <Chip label={entry.responseType} size="small" variant="outlined" />
                  {entry.mood && <Chip label={entry.mood} size="small" variant="outlined" />}
                </Stack>

                {/* Media Element */}
                {renderMediaElement(entry)}

                {/* Images */}
                {renderImages(entry)}

                <Typography variant="subtitle2" gutterBottom>
                  Response:
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1, mb: 3, borderLeft: 4, borderColor: '#1976d2' }}>
                  <Typography variant="body1" sx={{ fontStyle: entry.responseType !== 'text' ? 'italic' : 'normal' }}>
                    {entry.response}
                  </Typography>
                </Box>

                {entry.insights && entry.insights.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Insights:
                    </Typography>
                    <Stack spacing={1}>
                      {entry.insights.map((insight, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                          • {insight}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tags: {entry.tags.map(tag => `#${tag}`).join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </div>
        ) : (
          /* Sections */
          <>
            {sections.map((section, sectionIndex) => (
          <div key={section.id} style={{ pageBreakBefore: 'always' }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 4 }}>
              {sectionIndex + 1}. {section.title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {section.description}
            </Typography>

            {section.insights.length > 0 && (
              <Box sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Section Insights
                </Typography>
                <Stack spacing={1}>
                  {section.insights.map((insight, index) => (
                    <Typography key={index} variant="body2">
                      • {insight}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Entries */}
            {section.entries.map((entry, entryIndex) => (
              <Box key={entry.id} sx={{ mb: 4, pb: 3, borderBottom: entryIndex < section.entries.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {entry.exerciseTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(entry.completedAt)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Chip label={entry.category} size="small" />
                  <Chip label={entry.responseType} size="small" variant="outlined" />
                  {entry.mood && <Chip label={entry.mood} size="small" variant="outlined" />}
                </Stack>

                {/* Media Element */}
                {renderMediaElement(entry)}

                {/* Images */}
                {renderImages(entry)}

                <Typography variant="subtitle2" gutterBottom>
                  Response:
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1, mb: 3, borderLeft: 4, borderColor: '#1976d2' }}>
                  <Typography variant="body1" sx={{ fontStyle: entry.responseType !== 'text' ? 'italic' : 'normal' }}>
                    {entry.response}
                  </Typography>
                </Box>

                {entry.insights && entry.insights.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Insights:
                    </Typography>
                    <Stack spacing={1}>
                      {entry.insights.map((insight, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                          • {insight}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tags: {entry.tags.map(tag => `#${tag}`).join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </div>
            ))}
          </>
        )}

        {/* Footer */}
        <div style={{ pageBreakBefore: 'always' }}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
              Continue Your Journey
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              This playbook represents your personal development journey so far. 
              Keep exploring, reflecting, and growing. Your future self will thank you for the work you&apos;re doing today.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              Generated by North Playbook • {mounted ? new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </Typography>
          </Box>
        </div>
      </Box>
    );
  }
);

PrintablePlaybook.displayName = 'PrintablePlaybook';

export default function PlaybookPDF({ sections, entries, userName, viewMode, userDisplayName }: PlaybookPDFProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${userName || 'Personal'} Development Playbook`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `,
  });

  return (
    <>
      <Button
        variant="contained"
        startIcon={<GetApp />}
        onClick={handlePrint}
        size="large"
        sx={{ px: 4 }}
      >
        Download PDF
      </Button>
      
      {/* Hidden printable component */}
      <Box sx={{ display: 'none' }}>
        <PrintablePlaybook 
          ref={componentRef} 
          sections={sections} 
          entries={entries}
          userName={userName} 
          viewMode={viewMode}
          userDisplayName={userDisplayName}
        />
      </Box>
    </>
  );
} 
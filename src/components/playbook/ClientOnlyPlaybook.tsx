'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  GetApp,
  LibraryBooks,
  AutoAwesome,
  ViewList,
  Category,
  MenuBook,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { samplePlaybookEntries, generatePlaybookSections } from '@/data/playbook';
import PlaybookEntryComponent from '@/components/playbook/PlaybookEntry';
import PlaybookPDF from '@/components/playbook/PlaybookPDF';
import MagazineLayout from '@/components/playbook/MagazineLayout';

export default function ClientOnlyPlaybook() {
  const [viewMode, setViewMode] = useState<'timeline' | 'categories' | 'magazine'>('timeline');

  return <PlaybookContent viewMode={viewMode} setViewMode={setViewMode} />;
}

function PlaybookContent({ viewMode, setViewMode }: { 
  viewMode: 'timeline' | 'categories' | 'magazine';
  setViewMode: (mode: 'timeline' | 'categories' | 'magazine') => void;
}) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  // Generate playbook sections from sample data
  const sections = generatePlaybookSections(samplePlaybookEntries);
  const hasEntries = samplePlaybookEntries.length > 0;

  const handleViewModeChange = (event: React.SyntheticEvent, newValue: 'timeline' | 'categories' | 'magazine') => {
    setViewMode(newValue);
  };

  if (!hasEntries) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <LibraryBooks sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            Your Personal Playbook
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            A beautiful collection of your personal development journey, insights, and growth moments.
          </Typography>
        </Box>

        {/* Empty State */}
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <LibraryBooks sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" component="h2" gutterBottom>
              Your Playbook is Waiting
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Complete exercises and reflections to build your personal development story. 
              Each entry will be beautifully formatted and analyzed by AI to provide insights.
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/exercises"
              sx={{ px: 4 }}
            >
              Start Your First Exercise
            </Button>
          </CardContent>
        </Card>

        <Divider sx={{ my: 6 }} />

        {/* Features Preview */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            What Your Playbook Will Include
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4, mt: 4 }}>
            <Box>
              <AutoAwesome sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                AI-Generated Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Personalized analysis and recommendations based on your responses
              </Typography>
            </Box>
            <Box>
              <LibraryBooks sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Beautiful Layout
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Magazine-style formatting that makes your journey visually stunning
              </Typography>
            </Box>
            <Box>
              <GetApp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                PDF Export
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download and share your complete personal development story
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <LibraryBooks sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Your Personal Playbook
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          {samplePlaybookEntries.length} entries across {sections.length} categories
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 6, justifyContent: 'center' }}>
        <PlaybookPDF 
          sections={sections} 
          entries={viewMode === 'timeline' ? samplePlaybookEntries : undefined}
          userName={user?.signInDetails?.loginId || 'Your'}
          viewMode={viewMode}
          userDisplayName={user?.signInDetails?.loginId?.split('@')[0] || undefined}
        />
        <Button
          variant="outlined"
          startIcon={<AutoAwesome />}
          size="large"
          sx={{ px: 4 }}
        >
          Generate New Insights
        </Button>
      </Stack>

      {/* View Mode Tabs */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={viewMode}
          onChange={handleViewModeChange}
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<ViewList />}
            label="Timeline View"
            value="timeline"
            iconPosition="start"
          />
          <Tab
            icon={<Category />}
            label="By Category"
            value="categories"
            iconPosition="start"
          />
          <Tab
            icon={<MenuBook />}
            label="Magazine Layout"
            value="magazine"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content */}
      {viewMode === 'timeline' ? (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Your Journey Timeline
          </Typography>
          {samplePlaybookEntries
            .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
            .map((entry) => (
              <PlaybookEntryComponent key={entry.id} entry={entry} />
            ))}
        </Box>
      ) : viewMode === 'categories' ? (
        <Box>
          {sections.map((section) => (
            <Box key={section.id} sx={{ mb: 6 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'primary.main' }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {section.description}
                  </Typography>
                  
                  {section.insights.length > 0 && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Insights:
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
                  
                  <Typography variant="body2" color="text.secondary">
                    {section.entries.length} entries in this category
                  </Typography>
                </CardContent>
              </Card>
              
              {section.entries.map((entry) => (
                <PlaybookEntryComponent key={entry.id} entry={entry} />
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <MagazineLayout 
          sections={sections} 
          userName={user?.signInDetails?.loginId || 'Your'}
          userDisplayName={user?.signInDetails?.loginId?.split('@')[0] || undefined}
        />
      )}
    </Container>
  );
} 
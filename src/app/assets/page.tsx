'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Stack,
} from '@mui/material';
import {
  PhotoLibrary,
  Search,
  Cloud,
  Security,
} from '@mui/icons-material';
import AssetLibrary from '@/components/media/AssetLibrary';
import PlaybookAssetGallery from '@/components/playbook/PlaybookAssetGallery';

export default function AssetsPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <PhotoLibrary sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Asset Library & Semantic Search
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Manage all your uploaded text, audio, and video assets with powerful semantic search capabilities. 
          Each asset is automatically tagged and organized for easy discovery.
        </Typography>
      </Box>

      {/* Features Overview */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 6 }}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Search color="primary" />
            <Typography variant="h6">Semantic Search</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Search assets by content, description, mood, category, or tags. Our intelligent matching 
            finds relevant assets even with partial matches and provides relevance scores.
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Cloud color="primary" />
            <Typography variant="h6">User Directories</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Each user gets their own organized directory structure in S3 with automatic categorization 
            by exercise type and timestamp-based naming to prevent conflicts.
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Security color="primary" />
            <Typography variant="h6">Metadata Tagging</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Comprehensive metadata including exercise ID, category, mood, tags, and custom descriptions 
            enable powerful filtering and organization capabilities.
          </Typography>
        </Paper>
      </Stack>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> This demonstration uses mock data since you haven't uploaded any assets yet. 
          In production, your actual uploaded files would appear here with full search and filtering capabilities.
        </Typography>
      </Alert>

      {/* Playbook Asset Gallery (Compact View) */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          Playbook Integration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          This is how your assets appear within the playbook context, organized by category and with quick search.
        </Typography>
        <PlaybookAssetGallery 
          title="Playbook Assets"
          showSearch={true}
          compactMode={true}
        />
      </Box>

      {/* Full Asset Library */}
      <Box>
        <Typography variant="h4" gutterBottom>
          Complete Asset Library
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The full asset management interface with advanced filtering, multiple view modes, and bulk operations.
        </Typography>
        <AssetLibrary showActions={true} />
      </Box>

      {/* Technical Details */}
      <Paper sx={{ p: 4, mt: 6, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom>
          Technical Implementation
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          S3 Storage Structure:
        </Typography>
        <Box component="pre" sx={{ fontSize: '0.875rem', fontFamily: 'monospace', bgcolor: 'background.paper', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
{`users/
├── {userId}/
│   ├── playbook/                    # User's playbook assets
│   │   ├── mindset/                 # Category-based folders
│   │   │   ├── mindset-001/         # Exercise-specific folders
│   │   │   │   ├── 2024-01-15T10-30-00-000Z_affirmation_photo.jpg
│   │   │   │   └── 2024-01-15T14-20-00-000Z_vision_board.png
│   │   │   └── mindset-002/
│   │   │       └── 2024-01-16T09-15-00-000Z_meditation_space.jpg
│   │   ├── goals/
│   │   ├── motivation/
│   │   ├── reflection/
│   │   ├── gratitude/
│   │   └── vision/
│   ├── profile/                     # User profile assets
│   └── temp/                        # Temporary uploads`}
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Metadata Structure:
        </Typography>
        <Box component="pre" sx={{ fontSize: '0.875rem', fontFamily: 'monospace', bgcolor: 'background.paper', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
{`{
  "userId": "user123",
  "exerciseId": "mindset-001",
  "exerciseTitle": "Daily Affirmations",
  "category": "mindset",
  "responseType": "text",
  "mood": "positive",
  "tags": ["affirmations", "morning-routine", "self-love"],
  "uploadDate": "2024-01-15T10:30:00.000Z",
  "fileType": "image",
  "originalName": "affirmation_photo.jpg",
  "description": "Visual representation of my daily affirmations",
  "searchTags": "user123,image,mindset,mindset-001,text,affirmations,morning-routine,self-love"
}`}
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Key Features:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Semantic Search:</strong> Weighted scoring across multiple fields (title, description, tags, category)
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Advanced Filtering:</strong> By category, file type, date range, mood, and custom tags
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Multiple View Modes:</strong> Grid and list views with different levels of detail
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Asset Management:</strong> Upload, download, delete, and metadata updates
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Privacy & Security:</strong> User-isolated storage with proper access controls
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Scalable Architecture:</strong> Built on AWS S3 with efficient prefix-based queries
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 
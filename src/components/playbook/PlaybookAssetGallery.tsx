'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Chip,
  Stack,
  Grid,
  IconButton,
  Button,
  Tabs,
  Tab,
  Paper,
  Divider,
  Collapse,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ExpandLess,
  PhotoLibrary,
  VideoLibrary,
  AudioFile,
  Description,
  TrendingUp,
  AccessTime,
  Bookmark,
} from '@mui/icons-material';
import { storageService, AssetSearchResult, EXERCISE_CATEGORIES } from '@/lib/storage-service';
import AssetLibrary from '../media/AssetLibrary';
import ImageGallery from '../media/ImageGallery';
import { ImageData } from '../media/ImageUpload';
import ClientOnly from '../ClientOnly';

interface PlaybookAssetGalleryProps {
  exerciseId?: string;
  category?: string;
  tags?: string[];
  showSearch?: boolean;
  compactMode?: boolean;
  title?: string;
}

export default function PlaybookAssetGallery({
  exerciseId,
  category,
  tags = [],
  showSearch = true,
  compactMode = false,
  title = "My Assets"
}: PlaybookAssetGalleryProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<AssetSearchResult[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [recentAssets, setRecentAssets] = useState<AssetSearchResult[]>([]);
  const [categoryAssets, setCategoryAssets] = useState<Record<string, AssetSearchResult[]>>({});
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Convert tags array to string to avoid reference comparison issues
  const tagsKey = tags.join(',');

  useEffect(() => {
    // Only load if we haven't loaded yet, or if the key parameters changed
    if (!hasLoadedOnce || (hasLoadedOnce && (exerciseId || category))) {
      loadAssets();
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }
  }, [exerciseId, category, tagsKey, hasLoadedOnce]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, selectedTab]);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      let results: AssetSearchResult[] = [];

      if (exerciseId) {
        // Load assets for specific exercise
        const exerciseAssets = await storageService.getExerciseAssets(exerciseId);
        results = exerciseAssets.map(asset => ({
          ...asset,
          score: 1,
          matchedFields: ['exerciseId']
        })) as AssetSearchResult[];
      } else if (category) {
        // Load assets for specific category
        const catAssets = await storageService.getCategoryAssets(category);
        results = catAssets.map(asset => ({
          ...asset,
          score: 1,
          matchedFields: ['category']
        })) as AssetSearchResult[];
      } else {
        // Load all user assets - only do this once for general view
        results = await storageService.semanticSearch('', {
          sortBy: 'date',
          limit: 50
        });
      }

      setAssets(results);

      // Only load additional data for general view (not specific exercise/category)
      if (!exerciseId && !category) {
        // Load recent assets for quick access (reuse results to avoid extra call)
        setRecentAssets(results.slice(0, 10));

        // Group assets by category for browsing
        const grouped: Record<string, AssetSearchResult[]> = {};
        for (const asset of results) {
          const cat = asset.metadata.category || 'uncategorized';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(asset);
        }
        setCategoryAssets(grouped);
      } else {
        // Clear category browsing for specific views
        setRecentAssets([]);
        setCategoryAssets({});
      }

    } catch (err) {
      setError('Failed to load assets');
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    // Apply search filter
    if (searchTerm) {
      filtered = assets.filter(asset => {
        const searchableText = [
          asset.metadata.exerciseTitle,
          asset.metadata.description,
          asset.metadata.originalName,
          asset.metadata.category,
          asset.metadata.mood,
          ...(asset.metadata.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }

    // Apply tab filter
    switch (selectedTab) {
      case 1: // Images only
        filtered = filtered.filter(asset => asset.metadata.fileType === 'image');
        break;
      case 2: // Videos only
        filtered = filtered.filter(asset => asset.metadata.fileType === 'video');
        break;
      case 3: // Audio only
        filtered = filtered.filter(asset => asset.metadata.fileType === 'audio');
        break;
      case 0: // All assets
      default:
        break;
    }

    setFilteredAssets(filtered);
  };

  const convertToImageData = (assets: AssetSearchResult[]): ImageData[] => {
    return assets
      .filter(asset => asset.metadata.fileType === 'image')
      .map(asset => ({
        id: asset.key,
        name: asset.metadata.originalName,
        url: asset.url,
        caption: asset.metadata.description,
        s3Key: asset.key,
        metadata: asset.metadata
      }));
  };

  const renderAssetStats = () => {
    const stats = {
      total: assets.length,
      images: assets.filter(a => a.metadata.fileType === 'image').length,
      videos: assets.filter(a => a.metadata.fileType === 'video').length,
      audio: assets.filter(a => a.metadata.fileType === 'audio').length,
      documents: assets.filter(a => a.metadata.fileType === 'document').length,
    };

    return (
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip icon={<PhotoLibrary />} label={`${stats.total} Total`} />
        {stats.images > 0 && <Chip icon={<PhotoLibrary />} label={`${stats.images} Images`} variant="outlined" />}
        {stats.videos > 0 && <Chip icon={<VideoLibrary />} label={`${stats.videos} Videos`} variant="outlined" />}
        {stats.audio > 0 && <Chip icon={<AudioFile />} label={`${stats.audio} Audio`} variant="outlined" />}
        {stats.documents > 0 && <Chip icon={<Description />} label={`${stats.documents} Documents`} variant="outlined" />}
      </Stack>
    );
  };

  const renderRecentAssets = () => {
    if (recentAssets.length === 0) return null;

    const recentImages = convertToImageData(recentAssets);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <AccessTime color="primary" />
            <Typography variant="h6">Recently Added</Typography>
          </Stack>
          <ImageGallery 
            images={recentImages.slice(0, 6)} 
            variant="inline" 
            maxHeight={100}
          />
        </CardContent>
      </Card>
    );
  };

  const renderCategoryAssets = () => {
    if (Object.keys(categoryAssets).length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bookmark color="primary" />
          Browse by Category
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(categoryAssets).map(([cat, catAssets]) => {
            const images = convertToImageData(catAssets);
            return (
              <Grid item xs={12} sm={6} md={4} key={cat}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ textTransform: 'capitalize' }}>
                      {cat} ({catAssets.length})
                    </Typography>
                    {images.length > 0 && (
                      <ImageGallery 
                        images={images.slice(0, 3)} 
                        variant="inline" 
                        maxHeight={80}
                      />
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {catAssets.filter(a => a.metadata.fileType === 'image').length} images, {' '}
                      {catAssets.filter(a => a.metadata.fileType === 'video').length} videos, {' '}
                      {catAssets.filter(a => a.metadata.fileType === 'audio').length} audio
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }

    if (filteredAssets.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No assets found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Upload some assets to get started'}
          </Typography>
        </Box>
      );
    }

    // For image tab, use ImageGallery component
    if (selectedTab === 1) {
      const images = convertToImageData(filteredAssets);
      return (
        <ImageGallery 
          images={images} 
          variant={compactMode ? "inline" : "grid"}
          maxHeight={compactMode ? 150 : 250}
        />
      );
    }

    // For other tabs, use AssetLibrary component
    return (
      <AssetLibrary 
        compactMode={compactMode}
        showActions={false}
      />
    );
  };

  return (
    <ClientOnly fallback={
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    }>
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhotoLibrary color="primary" />
              {title}
            </Typography>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>

          {/* Asset Stats */}
          {expanded && renderAssetStats()}
        </Box>

        <Collapse in={expanded}>
          {/* Search */}
          {showSearch && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search your assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
          )}

          {/* Navigation Tabs */}
          <Box sx={{ mb: 3 }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              <Tab label="All Assets" />
              <Tab label="Images" />
              <Tab label="Videos" />
              <Tab label="Audio" />
            </Tabs>
          </Box>

          {/* Recent Assets (only show on "All" tab when not searching) */}
          {selectedTab === 0 && !searchTerm && renderRecentAssets()}

          {/* Category Browser (only show on "All" tab when not searching) */}
          {selectedTab === 0 && !searchTerm && renderCategoryAssets()}

          {/* Divider before main content */}
          {selectedTab === 0 && !searchTerm && <Divider sx={{ mb: 3 }} />}

          {/* Main Asset Display */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedTab === 0 && 'All Assets'}
              {selectedTab === 1 && 'Images'}
              {selectedTab === 2 && 'Videos'}
              {selectedTab === 3 && 'Audio Files'}
              {searchTerm && ` - Search: "${searchTerm}"`}
            </Typography>
            
            {renderTabContent()}
          </Box>
        </Collapse>
      </Paper>
    </ClientOnly>
  );
} 
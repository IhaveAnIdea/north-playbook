'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  TextField,
  Chip,
  Stack,
  Grid,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  ViewModule,
  ViewList,
  Sort,
  Download,
  Delete,
  Image as ImageIcon,
  AudioFile,
  VideoFile,
  Description,
  DateRange,
  Category,
  Psychology,
  TrendingUp,
  Flag,
  SelfImprovement,
  Favorite,
  Visibility,
  Close,
} from '@mui/icons-material';
// Date picker imports removed due to missing dependencies
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { storageService, AssetSearchResult, SemanticSearchOptions, EXERCISE_CATEGORIES, FILE_TYPES } from '@/lib/storage-service';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import ClientOnly from '../ClientOnly';

// Category icons mapping
const categoryIcons = {
  mindset: Psychology,
  motivation: TrendingUp,
  goals: Flag,
  reflection: SelfImprovement,
  gratitude: Favorite,
  vision: Visibility,
};

// File type icons
const fileTypeIcons = {
  image: ImageIcon,
  audio: AudioFile,
  video: VideoFile,
  document: Description,
};

interface AssetLibraryProps {
  onAssetSelect?: (asset: AssetSearchResult) => void;
  multiSelect?: boolean;
  selectedAssets?: AssetSearchResult[];
  showActions?: boolean;
  compactMode?: boolean;
}

export default function AssetLibrary({
  onAssetSelect,
  multiSelect = false,
  selectedAssets = [],
  showActions = true,
  compactMode = false
}: AssetLibraryProps) {
  const [assets, setAssets] = useState<AssetSearchResult[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'category' | 'type'>('date');
  const [selectedFilters, setSelectedFilters] = useState<SemanticSearchOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [assetStats, setAssetStats] = useState<{
    totalAssets: number;
    assetsByType: Record<string, number>;
    assetsByCategory: Record<string, number>;
  } | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Load assets and stats on component mount (only once)
  useEffect(() => {
    if (!hasLoadedOnce) {
      loadAssets();
      loadAssetStats();
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  // Filter and search assets when dependencies change
  useEffect(() => {
    filterAndSearchAssets();
  }, [assets, searchTerm, selectedFilters, sortBy]);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all assets with basic search to populate the library
      const results = await storageService.semanticSearch('', {
        sortBy: 'date',
        limit: 100
      });
      setAssets(results);
    } catch (err) {
      setError('Failed to load assets');
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssetStats = async () => {
    try {
      const stats = await storageService.getAssetStats();
      setAssetStats(stats);
    } catch (err) {
      console.error('Error loading asset stats:', err);
    }
  };

  const filterAndSearchAssets = useCallback(async () => {
    if (!searchTerm && Object.keys(selectedFilters).length === 0) {
      setFilteredAssets(assets.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.metadata.uploadDate).getTime() - new Date(a.metadata.uploadDate).getTime();
          case 'category':
            return (a.metadata.category || '').localeCompare(b.metadata.category || '');
          case 'type':
            return (a.metadata.fileType || '').localeCompare(b.metadata.fileType || '');
          default:
            return b.score - a.score;
        }
      }));
      return;
    }

    try {
      const results = await storageService.semanticSearch(searchTerm, {
        ...selectedFilters,
        sortBy,
        limit: 100
      });
      setFilteredAssets(results);
    } catch (err) {
      console.error('Error filtering assets:', err);
    }
  }, [assets, searchTerm, selectedFilters, sortBy]);

  const handleAssetClick = (asset: AssetSearchResult) => {
    if (multiSelect) {
      onAssetSelect?.(asset);
    } else {
      setSelectedAsset(asset);
    }
  };

  const handleDelete = async (asset: AssetSearchResult) => {
    try {
      await storageService.deleteAsset(asset.key);
      setAssets(prev => prev.filter(a => a.key !== asset.key));
      setFilteredAssets(prev => prev.filter(a => a.key !== asset.key));
    } catch (err) {
      setError('Failed to delete asset');
      console.error('Error deleting asset:', err);
    }
  };

  const handleDownload = (asset: AssetSearchResult) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.metadata.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAssetCard = (asset: AssetSearchResult) => {
    const isSelected = selectedAssets.some(selected => selected.key === asset.key);
    const FileTypeIcon = fileTypeIcons[asset.metadata.fileType as keyof typeof fileTypeIcons] || Description;
    const CategoryIcon = categoryIcons[asset.metadata.category as keyof typeof categoryIcons];

    return (
      <Card
        key={asset.key}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          }
        }}
        onClick={() => handleAssetClick(asset)}
      >
        {asset.metadata.fileType === 'image' && (
          <CardMedia
            component="img"
            height={compactMode ? 120 : 200}
            image={asset.url}
            alt={asset.metadata.originalName}
            sx={{ objectFit: 'cover' }}
          />
        )}
        
        {asset.metadata.fileType === 'video' && (
          <Box sx={{ height: compactMode ? 120 : 200, bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VideoFile sx={{ fontSize: 48, color: 'white' }} />
          </Box>
        )}
        
        {asset.metadata.fileType === 'audio' && (
          <Box sx={{ height: compactMode ? 120 : 200, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AudioFile sx={{ fontSize: 48, color: 'white' }} />
          </Box>
        )}

        <CardContent sx={{ p: compactMode ? 1 : 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FileTypeIcon fontSize="small" color="primary" />
              {CategoryIcon && <CategoryIcon fontSize="small" color="action" />}
            </Stack>
            {showActions && (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(asset); }}>
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>

          <Typography variant="subtitle2" noWrap title={asset.metadata.exerciseTitle || asset.metadata.originalName}>
            {asset.metadata.exerciseTitle || asset.metadata.originalName}
          </Typography>
          
          {asset.metadata.description && (
            <Typography variant="body2" color="text.secondary" sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical' 
            }}>
              {asset.metadata.description}
            </Typography>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {asset.metadata.category && (
              <Chip label={asset.metadata.category} size="small" variant="outlined" />
            )}
            {asset.metadata.mood && (
              <Chip label={asset.metadata.mood} size="small" color="primary" variant="outlined" />
            )}
          </Stack>

          {searchTerm && asset.matchedFields.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Matches: {asset.matchedFields.join(', ')}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {new Date(asset.metadata.uploadDate).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderAssetList = (asset: AssetSearchResult) => {
    const isSelected = selectedAssets.some(selected => selected.key === asset.key);
    const FileTypeIcon = fileTypeIcons[asset.metadata.fileType as keyof typeof fileTypeIcons] || Description;

    return (
      <Card
        key={asset.key}
        sx={{
          cursor: 'pointer',
          mb: 1,
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => handleAssetClick(asset)}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ minWidth: 60, height: 60, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {asset.metadata.fileType === 'image' ? (
                <img src={asset.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <FileTypeIcon sx={{ fontSize: 32 }} color="primary" />
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1">
                {asset.metadata.exerciseTitle || asset.metadata.originalName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {asset.metadata.description}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={asset.metadata.category} size="small" />
                <Chip label={asset.metadata.fileType} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {new Date(asset.metadata.uploadDate).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>

            {showActions && (
              <Stack direction="row" spacing={1}>
                <IconButton onClick={(e) => { e.stopPropagation(); handleDownload(asset); }}>
                  <Download />
                </IconButton>
                <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}>
                  <Delete />
                </IconButton>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3, p: 2 }}>
      <Typography variant="h6" gutterBottom>Filters</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedFilters.categories?.[0] || ''}
              onChange={(e) => setSelectedFilters(prev => ({
                ...prev,
                categories: e.target.value ? [e.target.value] : undefined
              }))}
            >
              <MenuItem value="">All Categories</MenuItem>
              {Object.values(EXERCISE_CATEGORIES).map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>File Type</InputLabel>
            <Select
              value={selectedFilters.fileTypes?.[0] || ''}
              onChange={(e) => setSelectedFilters(prev => ({
                ...prev,
                fileTypes: e.target.value ? [e.target.value] : undefined
              }))}
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.values(FILE_TYPES).map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="relevance">Relevance</MenuItem>
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setSelectedFilters({})}
            disabled={Object.keys(selectedFilters).length === 0}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>
    </Card>
  );

  return (
    <ClientOnly fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    }>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Asset Library
          </Typography>
          
          {assetStats && (
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Chip label={`${assetStats.totalAssets} Total Assets`} />
              {Object.entries(assetStats.assetsByType).map(([type, count]) => (
                <Chip key={type} label={`${count} ${type}`} variant="outlined" />
              ))}
            </Stack>
          )}
        </Box>

      {/* Search and Controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search assets by name, description, tags, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        
        <Button
          variant={showFilters ? "contained" : "outlined"}
          startIcon={<FilterList />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
        
        <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
        </IconButton>
      </Stack>

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Assets Grid/List */}
      {!loading && (
        <>
          {filteredAssets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No assets found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || Object.keys(selectedFilters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Upload some assets to get started'
                }
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing {filteredAssets.length} assets
              </Typography>
              
              {viewMode === 'grid' ? (
                <Grid container spacing={2}>
                  {filteredAssets.map((asset) => (
                    <Grid item xs={12} sm={6} md={compactMode ? 3 : 4} lg={compactMode ? 2 : 3} key={asset.key}>
                      {renderAssetCard(asset)}
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {filteredAssets.map(renderAssetList)}
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Asset Detail Dialog */}
      <Dialog
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedAsset && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedAsset.metadata.exerciseTitle || selectedAsset.metadata.originalName}
              <IconButton onClick={() => setSelectedAsset(null)}>
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent>
              {selectedAsset.metadata.fileType === 'image' && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img 
                    src={selectedAsset.url} 
                    alt={selectedAsset.metadata.originalName}
                    style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }}
                  />
                </Box>
              )}
              
              {selectedAsset.metadata.fileType === 'audio' && (
                <Box sx={{ mb: 2 }}>
                  <AudioPlayer 
                    src={selectedAsset.url}
                    title={selectedAsset.metadata.exerciseTitle}
                  />
                </Box>
              )}
              
              {selectedAsset.metadata.fileType === 'video' && (
                <Box sx={{ mb: 2 }}>
                  <VideoPlayer 
                    src={selectedAsset.url}
                    title={selectedAsset.metadata.exerciseTitle}
                  />
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Category</Typography>
                  <Typography variant="body2">{selectedAsset.metadata.category}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Upload Date</Typography>
                  <Typography variant="body2">
                    {new Date(selectedAsset.metadata.uploadDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Description</Typography>
                  <Typography variant="body2">
                    {selectedAsset.metadata.description || 'No description'}
                  </Typography>
                </Grid>
                
                {selectedAsset.metadata.tags && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Tags</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {(Array.isArray(selectedAsset.metadata.tags) 
                        ? selectedAsset.metadata.tags 
                        : selectedAsset.metadata.tags.split(',').filter(Boolean)
                      ).map((tag, index) => (
                        <Chip key={index} label={tag.trim()} size="small" />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => handleDownload(selectedAsset)} startIcon={<Download />}>
                Download
              </Button>
              {showActions && (
                <Button 
                  onClick={() => handleDelete(selectedAsset)} 
                  startIcon={<Delete />}
                  color="error"
                >
                  Delete
                </Button>
              )}
              <Button onClick={() => setSelectedAsset(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
    </ClientOnly>
  );
} 
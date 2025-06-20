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
import DocumentThumbnail from '@/components/media/DocumentThumbnail';

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
  type: 'cover' | 'journey-map' | 'milestone' | 'reflection-spread' | 'vision-board' | 'growth-story' | 'transformation';
  content?: PlaybookEntry[];
  section?: PlaybookSection;
  title?: string;
  subtitle?: string;
  narrative?: string;
  theme?: string;
  mediaFocus?: 'images' | 'videos' | 'audio' | 'documents' | 'mixed';
}

export default function MagazineLayout({ sections, userName = 'Your', userDisplayName }: MagazineLayoutProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract and analyze user's journey data
  const analyzeJourney = () => {
    const allEntries = sections.flatMap(s => s.entries);
    const totalEntries = allEntries.length;
    
    // Extract key themes and insights
    const allInsights = allEntries.flatMap(e => e.insights || []);
    const keyThemes = [...new Set(allEntries.map(e => e.category))];
    
    // Chronological progression
    const chronological = allEntries.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    const recentEntries = allEntries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()).slice(0, 6);
    
    // Media analysis
    const entriesWithImages = allEntries.filter(e => e.images && e.images.length > 0);
    const entriesWithVideos = allEntries.filter(e => e.videos && e.videos.length > 0);
    const entriesWithAudio = allEntries.filter(e => e.audioFiles && e.audioFiles.length > 0);
    const entriesWithDocuments = allEntries.filter(e => e.documents && e.documents.length > 0);
    
    // Growth milestones (entries with significant insights or transformations)
    const milestones = allEntries.filter(e => 
      (e.insights && e.insights.length > 2) || 
      e.mood === 'accomplished' || 
      e.tags?.includes('breakthrough')
    );

    return {
      totalEntries,
      allInsights,
      keyThemes,
      chronological,
      recentEntries,
      entriesWithImages,
      entriesWithVideos,
      entriesWithAudio,
      entriesWithDocuments,
      milestones,
      timeSpan: totalEntries > 0 ? {
        start: chronological[0]?.completedAt,
        end: chronological[chronological.length - 1]?.completedAt
      } : null
    };
  };

  const journeyData = analyzeJourney();

  // Generate magazine-style narrative pages
  const generatePages = (): MagazinePage[] => {
    const pages: MagazinePage[] = [];
    
    // 1. Cover - The Journey Begins
    pages.push({
      type: 'cover',
      title: `${userDisplayName || userName} Personal Journey`,
      subtitle: 'A Story of Growth, Discovery & True North',
      narrative: `${journeyData.totalEntries} moments of transformation across ${journeyData.keyThemes.length} life areas`
    });

    // 2. Journey Map - Visual Overview
    pages.push({
      type: 'journey-map',
      title: 'Charting Your Course',
      subtitle: 'The landscape of your personal development',
      content: journeyData.chronological,
      narrative: `From ${journeyData.timeSpan?.start ? formatDate(journeyData.timeSpan.start) : 'the beginning'} to ${journeyData.timeSpan?.end ? formatDate(journeyData.timeSpan.end) : 'today'}, mapping the territory of growth`
    });

    // 3. Vision Board - Images & Dreams
    if (journeyData.entriesWithImages.length > 0) {
      pages.push({
        type: 'vision-board',
        title: 'Visual Manifestations',
        subtitle: 'The images that shape your reality',
        content: journeyData.entriesWithImages,
        mediaFocus: 'images',
        narrative: 'Every image tells a story of intention, progress, and possibility'
      });
    }

    // 4. Milestone Moments - Key Transformations
    if (journeyData.milestones.length > 0) {
      journeyData.milestones.forEach((milestone, index) => {
        pages.push({
          type: 'milestone',
          title: `Breakthrough ${index + 1}`,
          subtitle: milestone.exerciseTitle,
          content: [milestone],
          narrative: 'A moment when everything shifted',
          theme: milestone.category
        });
      });
    }

    // 5. Reflection Spreads - Deep Insights by Theme
    journeyData.keyThemes.forEach(theme => {
      const themeEntries = journeyData.chronological.filter(e => e.category === theme);
      if (themeEntries.length > 0) {
        pages.push({
          type: 'reflection-spread',
          title: theme.charAt(0).toUpperCase() + theme.slice(1),
          subtitle: 'Exploring the depths of transformation',
          content: themeEntries,
          theme,
          narrative: `How ${theme} has evolved in your journey`
        });
      }
    });

    // 6. Media Stories - Rich Content Features
    if (journeyData.entriesWithVideos.length > 0) {
      pages.push({
        type: 'growth-story',
        title: 'Moving Pictures',
        subtitle: 'Your story in motion',
        content: journeyData.entriesWithVideos,
        mediaFocus: 'videos',
        narrative: 'The moments you chose to capture in video tell a powerful story'
      });
    }

    if (journeyData.entriesWithAudio.length > 0) {
      pages.push({
        type: 'growth-story',
        title: 'Voices of Change',
        subtitle: 'The sound of your evolution',
        content: journeyData.entriesWithAudio,
        mediaFocus: 'audio',
        narrative: 'Your voice carries the emotion and authenticity of real transformation'
      });
    }

    if (journeyData.entriesWithDocuments.length > 0) {
      pages.push({
        type: 'growth-story',
        title: 'Written Wisdom',
        subtitle: 'Documents of discovery',
        content: journeyData.entriesWithDocuments,
        mediaFocus: 'documents',
        narrative: 'The artifacts of learning that mark your path forward'
      });
    }

    // 7. Transformation Summary - Where You're Headed
    pages.push({
      type: 'transformation',
      title: 'True North Revealed',
      subtitle: 'The direction of your becoming',
      content: journeyData.recentEntries,
      narrative: 'Every step has been leading to this moment of clarity about who you are becoming'
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

  const getCategoryColor = (category: string) => {
    const colors = {
      mindset: 'from-purple-600 to-indigo-700',
      motivation: 'from-orange-600 to-red-700',
      goals: 'from-green-600 to-emerald-700',
      reflection: 'from-blue-600 to-cyan-700',
      gratitude: 'from-pink-600 to-rose-700',
      vision: 'from-amber-600 to-yellow-700',
    } as const;
    return colors[category as keyof typeof colors] || 'from-gray-600 to-gray-700';
  };

  const renderCoverPage = (page: MagazinePage) => {
    const featuredImages = journeyData.entriesWithImages.slice(0, 3);
    
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        {/* Magazine Header */}
        <div className="absolute top-0 left-0 right-0 p-6 border-b border-white/20">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold tracking-widest">PERSONAL DEVELOPMENT QUARTERLY</div>
            <div className="text-sm opacity-80">
              {mounted ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : ''}
            </div>
          </div>
        </div>

        {/* Background Images */}
        {featuredImages.map((entry, idx) => 
          entry.images?.map((image, imgIdx) => (
            <div
              key={`${idx}-${imgIdx}`}
              className={`absolute opacity-20 ${
                idx === 0 ? 'top-20 right-10 w-48 h-32 rotate-12' :
                idx === 1 ? 'bottom-32 left-20 w-40 h-28 -rotate-6' :
                'top-40 left-1/2 w-36 h-24 rotate-3'
              }`}
            >
              <img src={image.url} alt="" className="w-full h-full object-cover rounded-lg" />
            </div>
          ))
        )}

        {/* Main Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-12">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {page.title}
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl mb-8 opacity-90 font-light">
              {page.subtitle}
            </h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto leading-relaxed">
              {page.narrative}
            </p>
            
            {/* Stats Bar */}
            <div className="flex justify-center space-x-8 mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold">{journeyData.totalEntries}</div>
                <div className="text-sm opacity-70">Moments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{journeyData.keyThemes.length}</div>
                <div className="text-sm opacity-70">Themes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{journeyData.allInsights.length}</div>
                <div className="text-sm opacity-70">Insights</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderJourneyMap = (page: MagazinePage) => {
    return (
      <div className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
            <h2 className="text-xl text-gray-600 mb-4">{page.subtitle}</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">{page.narrative}</p>
          </div>

          {/* Timeline Visualization */}
          <div className="flex-1 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 transform -translate-x-1/2"></div>
            
            <div className="space-y-8">
              {page.content?.map((entry, index) => (
                <div key={entry.id} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} relative`}>
                  <div className={`w-80 ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize bg-gradient-to-r ${getCategoryColor(entry.category)} text-white`}>
                          {entry.category}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(entry.completedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{entry.exerciseTitle}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{entry.response}</p>
                      
                      {/* Media indicators */}
                      <div className="flex space-x-2 mt-2">
                        {entry.images?.length > 0 && (
                          <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {entry.videos?.length > 0 && (
                          <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {entry.audioFiles?.length > 0 && (
                          <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className={`absolute top-4 left-1/2 w-4 h-4 rounded-full border-4 border-white transform -translate-x-1/2 bg-gradient-to-r ${getCategoryColor(entry.category)}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVisionBoard = (page: MagazinePage) => {
    const allImages = page.content?.flatMap(entry => entry.images || []) || [];
    
    return (
      <div className="h-full bg-white p-8">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
            <h2 className="text-xl text-gray-600 mb-4">{page.subtitle}</h2>
            <p className="text-gray-700 max-w-2xl mx-auto italic">{page.narrative}</p>
          </div>

          {/* Image Grid */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 columns-3 gap-4 space-y-4">
              {allImages.map((image, index) => (
                <div key={image.id} className="break-inside-avoid relative group">
                  <img 
                    src={image.url} 
                    alt={image.caption || image.name}
                    className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-end">
                    <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-sm font-medium">{image.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMilestone = (page: MagazinePage) => {
    const entry = page.content?.[0];
    if (!entry) return null;

    return (
      <div className={`h-full bg-gradient-to-br ${getCategoryColor(entry.category)} text-white p-8`}>
        <div className="h-full flex flex-col justify-center">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                {page.title}
              </span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6">{page.subtitle}</h1>
            <p className="text-xl opacity-90 mb-8 italic">{page.narrative}</p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-left">
              <p className="text-lg leading-relaxed mb-6">{entry.response}</p>
              
              {/* Media Content */}
              {entry.images && entry.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {entry.images.slice(0, 4).map(image => (
                    <img key={image.id} src={image.url} alt={image.caption || ''} className="w-full h-32 object-cover rounded-lg" />
                  ))}
                </div>
              )}
              
              {entry.videos && entry.videos.length > 0 && (
                <div className="mb-6">
                  <VideoPlayer src={entry.videos[0].url} title={entry.videos[0].name} />
                </div>
              )}
              
              {entry.audioFiles && entry.audioFiles.length > 0 && (
                <div className="mb-6">
                  <AudioPlayer src={entry.audioFiles[0].url} title={entry.audioFiles[0].name} />
                </div>
              )}
              
              {/* Insights */}
              {entry.insights && entry.insights.length > 0 && (
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                  <div className="space-y-2">
                    {entry.insights.map((insight, idx) => (
                      <p key={idx} className="flex items-start text-sm">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReflectionSpread = (page: MagazinePage) => {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="h-full flex">
          {/* Left Column - Theme Overview */}
          <div className="w-1/3 pr-8">
            <div className={`h-full bg-gradient-to-br ${getCategoryColor(page.theme || '')} text-white rounded-2xl p-8`}>
              <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
              <h2 className="text-lg opacity-90 mb-6">{page.subtitle}</h2>
              <p className="text-sm leading-relaxed italic mb-8">{page.narrative}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{page.content?.length}</div>
                  <div className="text-sm opacity-80">Entries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{page.content?.flatMap(e => e.insights || []).length}</div>
                  <div className="text-sm opacity-80">Insights</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{page.content?.flatMap(e => e.images || []).length}</div>
                  <div className="text-sm opacity-80">Images</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Content Flow */}
          <div className="w-2/3 space-y-6 overflow-y-auto max-h-full">
            {page.content?.map((entry, index) => (
              <div key={entry.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{entry.exerciseTitle}</h3>
                  <span className="text-sm text-gray-500">{formatDate(entry.completedAt)}</span>
                </div>
                
                <p className="text-gray-700 mb-4 leading-relaxed">{entry.response}</p>
                
                {/* Mixed Media Layout */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Images */}
                  {entry.images?.slice(0, 2).map(image => (
                    <img key={image.id} src={image.url} alt={image.caption || ''} className="w-full h-20 object-cover rounded-lg" />
                  ))}
                  
                  {/* Video/Audio in remaining space */}
                  {entry.videos?.length > 0 && (
                    <div className="col-span-1">
                      <VideoPlayer src={entry.videos[0].url} title={entry.videos[0].name} />
                    </div>
                  )}
                  
                  {entry.audioFiles?.length > 0 && !entry.videos?.length && (
                    <div className="col-span-1">
                      <AudioPlayer src={entry.audioFiles[0].url} title={entry.audioFiles[0].name} />
                    </div>
                  )}
                  
                  {/* Documents */}
                  {entry.documents?.slice(0, 1).map(doc => (
                    <div key={doc.id} className="col-span-1">
                      <DocumentThumbnail document={doc} showDownload={true} showRemove={false} />
                    </div>
                  ))}
                </div>
                
                {/* Key insights for this entry */}
                {entry.insights && entry.insights.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      {entry.insights.slice(0, 2).map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {insight}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGrowthStory = (page: MagazinePage) => {
    const getMediaIcon = () => {
      switch (page.mediaFocus) {
        case 'videos': return '🎥';
        case 'audio': return '🎵';
        case 'documents': return '📄';
        default: return '📸';
      }
    };

    return (
      <div className="h-full bg-gradient-to-br from-purple-50 to-indigo-50 p-8">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">{getMediaIcon()}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
            <h2 className="text-xl text-gray-600 mb-4">{page.subtitle}</h2>
            <p className="text-gray-700 max-w-2xl mx-auto italic">{page.narrative}</p>
          </div>

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              {page.content?.map((entry, index) => (
                <div key={entry.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{entry.exerciseTitle}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{entry.response}</p>
                  </div>
                  
                  {/* Media Content */}
                  <div className="px-4 pb-4">
                    {page.mediaFocus === 'videos' && entry.videos?.map(video => (
                      <VideoPlayer key={video.id} src={video.url} title={video.name} />
                    ))}
                    
                    {page.mediaFocus === 'audio' && entry.audioFiles?.map(audio => (
                      <AudioPlayer key={audio.id} src={audio.url} title={audio.name} />
                    ))}
                    
                    {page.mediaFocus === 'documents' && entry.documents?.map(doc => (
                      <DocumentThumbnail key={doc.id} document={doc} showDownload={true} showRemove={false} />
                    ))}
                    
                    {page.mediaFocus === 'images' && (
                      <div className="grid grid-cols-2 gap-2">
                        {entry.images?.slice(0, 4).map(image => (
                          <img key={image.id} src={image.url} alt={image.caption || ''} className="w-full h-24 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 pb-4 text-xs text-gray-500">
                    {formatDate(entry.completedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransformation = (page: MagazinePage) => {
    return (
      <div className="h-full bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-8">
        <div className="h-full flex flex-col justify-center text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">{page.title}</h1>
              <h2 className="text-2xl text-gray-600 mb-6">{page.subtitle}</h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto italic mb-12">
                {page.narrative}
              </p>
            </div>

            {/* Recent Journey Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Current Trajectory</h3>
              <div className="grid grid-cols-3 gap-8">
                {page.content?.slice(0, 3).map((entry, index) => (
                  <div key={entry.id} className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${getCategoryColor(entry.category)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{entry.exerciseTitle}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{entry.response}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights Summary */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-6">Wisdom Gained</h3>
              <div className="grid grid-cols-2 gap-6 text-left">
                {journeyData.allInsights.slice(-6).map((insight, index) => (
                  <p key={index} className="flex items-start text-sm">
                    <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPage = (page: MagazinePage) => {
    switch (page.type) {
      case 'cover':
        return renderCoverPage(page);
      case 'journey-map':
        return renderJourneyMap(page);
      case 'vision-board':
        return renderVisionBoard(page);
      case 'milestone':
        return renderMilestone(page);
      case 'reflection-spread':
        return renderReflectionSpread(page);
      case 'growth-story':
        return renderGrowthStory(page);
      case 'transformation':
        return renderTransformation(page);
      default:
        return <div className="h-full bg-gray-100 flex items-center justify-center">Page type not implemented</div>;
    }
  };

  if (pages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Content Yet</h2>
          <p className="text-gray-600">Complete some exercises to create your magazine story!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Magazine Page */}
      <div className="absolute inset-4 bg-white shadow-2xl rounded-lg overflow-hidden">
        {renderPage(pages[currentPage])}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className="p-2 rounded-full bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span className="text-white text-sm font-medium px-4">
          {currentPage + 1} of {totalPages}
        </span>
        
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className="p-2 rounded-full bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Page Indicator */}
      <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-white text-sm font-medium">{pages[currentPage]?.title}</span>
      </div>
    </div>
  );
} 
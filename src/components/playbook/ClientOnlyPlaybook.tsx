'use client';

import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generatePlaybookSections, type PlaybookEntry } from '@/data/playbook';
import BeautifulMagazine from './BeautifulMagazine';

export default function ClientOnlyPlaybook() {
  const [viewMode, setViewMode] = useState<'magazine' | 'masonry' | 'timeline' | 'categories'>('magazine');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <PlaybookContent 
      viewMode={viewMode} 
      setViewMode={setViewMode} 
      filterCategory={filterCategory} 
      setFilterCategory={setFilterCategory} 
      searchTerm={searchTerm} 
      setSearchTerm={setSearchTerm} 
    />
  );
}

function PlaybookContent({ 
  viewMode, 
  setViewMode, 
  filterCategory, 
  setFilterCategory,
  searchTerm,
  setSearchTerm 
}: { 
  viewMode: 'magazine' | 'masonry' | 'timeline' | 'categories';
  setViewMode: (mode: 'magazine' | 'masonry' | 'timeline' | 'categories') => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  const { user } = useAuthenticator((context) => [context.user]);
  const [playbookEntries, setPlaybookEntries] = useState<PlaybookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch real playbook entries directly from Amplify
  useEffect(() => {
    fetchPlaybookEntries();
  }, []);

  const fetchPlaybookEntries = async () => {
    try {
      setLoading(true);
      
      // Import Amplify client dynamically to avoid SSR issues
      const { generateClient } = await import('aws-amplify/api');
      const { getUrl } = await import('aws-amplify/storage');
      const client = generateClient();
      
      // Fetch playbook entries from Amplify
      const response = await client.models.PlaybookEntry.list({
        limit: 100
      });
      
      if (!response.data) {
        setPlaybookEntries([]);
        return;
      }
      
      // Convert Amplify entries to UI format
      const uiEntries: PlaybookEntry[] = [];
      for (const amplifyEntry of response.data) {
        // Convert S3 keys to image URLs
        const images = [];
        if (amplifyEntry.imageS3Keys && amplifyEntry.imageS3Keys.length > 0) {
          for (const s3Key of amplifyEntry.imageS3Keys) {
            try {
              const result = await getUrl({ key: s3Key });
              const url = result.url.toString();
              const fileName = s3Key.split('/').pop() || s3Key;
              
              images.push({
                id: s3Key,
                name: fileName,
                url: url,
                s3Key: s3Key,
                caption: `Image from ${amplifyEntry.title}`,
                type: 'image/jpeg',
                metadata: {
                  playbookEntryId: amplifyEntry.id,
                  category: amplifyEntry.category
                }
              });
            } catch (error) {
              console.warn(`Failed to get URL for image ${s3Key}:`, error);
            }
          }
        }
        
        // Convert S3 keys to video URLs
        const videos = [];
        if (amplifyEntry.videoS3Keys && amplifyEntry.videoS3Keys.length > 0) {
          for (const s3Key of amplifyEntry.videoS3Keys) {
            try {
              const result = await getUrl({ key: s3Key });
              const url = result.url.toString();
              const fileName = s3Key.split('/').pop() || s3Key;
              
              videos.push({
                id: s3Key,
                name: fileName,
                url: url,
                s3Key: s3Key,
                type: 'video/mp4',
                size: 0, // Size unknown from S3 key alone
                duration: 0, // Duration unknown from S3 key alone
                metadata: {
                  playbookEntryId: amplifyEntry.id,
                  category: amplifyEntry.category
                }
              });
            } catch (error) {
              console.warn(`Failed to get URL for video ${s3Key}:`, error);
            }
          }
        }
        
        // Convert S3 keys to document URLs
        const documents = [];
        if (amplifyEntry.documentS3Keys && amplifyEntry.documentS3Keys.length > 0) {
          for (const s3Key of amplifyEntry.documentS3Keys) {
            try {
              const result = await getUrl({ key: s3Key });
              const url = result.url.toString();
              const fileName = s3Key.split('/').pop() || s3Key;
              
              documents.push({
                id: s3Key,
                name: fileName,
                url: url,
                s3Key: s3Key,
                type: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                size: 0, // Size unknown from S3 key alone
                metadata: {
                  playbookEntryId: amplifyEntry.id,
                  category: amplifyEntry.category
                }
              });
            } catch (error) {
              console.warn(`Failed to get URL for document ${s3Key}:`, error);
            }
          }
        }
        
        // Convert S3 keys to audio URLs
        const audioFiles = [];
        if (amplifyEntry.audioS3Keys && amplifyEntry.audioS3Keys.length > 0) {
          for (const s3Key of amplifyEntry.audioS3Keys) {
            try {
              const result = await getUrl({ key: s3Key });
              const url = result.url.toString();
              const fileName = s3Key.split('/').pop() || s3Key;
              
              audioFiles.push({
                id: s3Key,
                name: fileName,
                url: url,
                duration: 0 // Duration unknown from S3 key alone
              });
            } catch (error) {
              console.warn(`Failed to get URL for audio ${s3Key}:`, error);
            }
          }
        }
        
        const uiEntry: PlaybookEntry = {
          id: amplifyEntry.id,
          exerciseId: amplifyEntry.exerciseResponseId || 'unknown',
          exerciseTitle: amplifyEntry.title,
          category: amplifyEntry.category,
          completedAt: new Date(amplifyEntry.createdAt),
          response: amplifyEntry.content,
          responseType: videos.length > 0 ? 'video' : audioFiles.length > 0 ? 'audio' : 'text',
          insights: amplifyEntry.insights ? (typeof amplifyEntry.insights === 'string' ? JSON.parse(amplifyEntry.insights) : amplifyEntry.insights) : [],
          mood: amplifyEntry.mood,
          tags: amplifyEntry.tags || [],
          images: images,
          videos: videos,
          documents: documents,
          audioFiles: audioFiles
        };
        
        uiEntries.push(uiEntry);
      }
      
      // Sort by creation date (newest first)
      uiEntries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      
      setPlaybookEntries(uiEntries);
    } catch (error) {
      console.error('Error fetching playbook entries:', error);
      setError(error instanceof Error ? error.message : 'Failed to load playbook entries');
      setPlaybookEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter entries
  const filteredEntries = playbookEntries.filter(entry => {
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      entry.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(playbookEntries.map(entry => entry.category)))];

  // Generate playbook sections from real data
  const sections = generatePlaybookSections(playbookEntries);
  const hasEntries = playbookEntries.length > 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Journey</h2>
            <p className="text-gray-600">Gathering your personal development story...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Playbook</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={fetchPlaybookEntries}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <a 
                href="/exercises"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Complete Assignments
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasEntries) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Your Personal <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Playbook</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A beautiful collection of your personal development journey, insights, and growth moments.
            </p>
          </div>

          {/* Empty State Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Journey</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your playbook is waiting to be filled with amazing insights and growth moments. Complete some exercises to begin building your personal development collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/exercises"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Explore Exercises
              </a>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/playbook/migrate-completed', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user?.userId })
                    });
                    const result = await response.json();
                    if (result.success && result.migratedCount > 0) {
                      alert(`Successfully migrated ${result.migratedCount} completed exercises to your playbook!`);
                      fetchPlaybookEntries();
                    } else {
                      alert(result.message || 'No completed exercises found to migrate');
                    }
                  } catch (error) {
                    console.error('Migration error:', error);
                    alert('Failed to migrate completed exercises');
                  }
                }}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                Import Completed Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header - Simplified in Magazine View */}
        {viewMode !== 'magazine' && (
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Personal <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Playbook</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            {filteredEntries.length} meaningful moments across your personal development journey
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {sections.length} categories
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete journey
            </span>
          </div>
        </div>
        )}

        {/* Controls - Hidden in Magazine View */}
        {viewMode !== 'magazine' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search your journey..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    filterCategory === category
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['magazine', 'masonry', 'timeline', 'categories'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'masonry' ? 'Grid' : mode}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Action Buttons - Hidden in Magazine View */}
        {viewMode !== 'magazine' && (
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export PDF</span>
          </button>
          <button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Generate Insights</span>
          </button>
          <button 
            onClick={fetchPlaybookEntries}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        )}

        {/* Magazine Mode Toggle */}
        {viewMode === 'magazine' && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200">
              {(['magazine', 'masonry', 'timeline', 'categories'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 rounded-lg font-medium capitalize transition-all text-sm ${
                    viewMode === mode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'masonry' ? 'Grid' : mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'magazine' ? (
          <BeautifulMagazine 
            sections={sections} 
            userName={user?.signInDetails?.loginId || 'Your'} 
            userDisplayName={user?.username}
          />
        ) : viewMode === 'masonry' ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredEntries.map((entry, index) => (
              <div key={entry.id} className="break-inside-avoid">
                <MasonryCard entry={entry} index={index} />
              </div>
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600"></div>
              
              {filteredEntries.map((entry, index) => (
                <TimelineCard key={entry.id} entry={entry} index={index} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {sections
              .filter(section => filterCategory === 'all' || 
                section.entries.some((entry: PlaybookEntry) => entry.category === filterCategory))
              .map((section) => (
                <CategorySection key={section.id} section={section} searchTerm={searchTerm} />
              ))}
          </div>
        )}

        {filteredEntries.length === 0 && (playbookEntries.length > 0) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No matching entries</h3>
            <p className="text-gray-600">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual card components
function MasonryCard({ entry, index }: { entry: PlaybookEntry; index: number }) {
  const categoryColors = {
    mindset: 'from-purple-500 to-indigo-600',
    motivation: 'from-orange-500 to-red-600', 
    goals: 'from-green-500 to-emerald-600',
    reflection: 'from-blue-500 to-cyan-600',
    gratitude: 'from-pink-500 to-rose-600',
    vision: 'from-amber-500 to-yellow-600',
  } as const;

  const categoryGradient = categoryColors[entry.category as keyof typeof categoryColors] || 'from-gray-500 to-gray-600';

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${categoryGradient} p-6 text-white`}>
        <div className="flex items-center justify-between mb-2">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium capitalize">
            {entry.category}
          </span>
          <span className="text-sm opacity-80">
            {entry.completedAt.toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-xl font-bold leading-tight">{entry.exerciseTitle}</h3>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed line-clamp-4">
            {entry.response}
          </p>
        </div>

        {/* Images */}
        {entry.images && entry.images.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {entry.images.slice(0, 4).map((image, idx) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.caption || ''}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
            {entry.images.length > 4 && (
              <p className="text-sm text-gray-500 mt-2">+{entry.images.length - 4} more images</p>
            )}
          </div>
        )}

        {/* Insights */}
        {entry.insights && entry.insights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Insights</h4>
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

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                #{tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineCard({ entry, index }: { entry: PlaybookEntry; index: number }) {
  const categoryColors = {
    mindset: 'border-purple-500 bg-purple-50',
    motivation: 'border-orange-500 bg-orange-50',
    goals: 'border-green-500 bg-green-50',
    reflection: 'border-blue-500 bg-blue-50',
    gratitude: 'border-pink-500 bg-pink-50',
    vision: 'border-amber-500 bg-amber-50',
  } as const;

  const categoryStyle = categoryColors[entry.category as keyof typeof categoryColors] || 'border-gray-500 bg-gray-50';

  return (
    <div className="relative pl-20 pb-12">
      {/* Timeline dot */}
      <div className={`absolute left-6 w-4 h-4 rounded-full border-4 ${categoryStyle.split(' ')[0]} bg-white`}></div>
      
      {/* Card */}
      <div 
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
        style={{ animationDelay: `${index * 150}ms` }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{entry.exerciseTitle}</h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${categoryStyle}`}>
                  {entry.category}
                </span>
                <span className="text-sm text-gray-500">
                  {entry.completedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">{entry.response}</p>
          </div>

          {entry.images && entry.images.length > 0 && (
            <div className="mb-4">
              <div className="flex space-x-2 overflow-x-auto">
                {entry.images.map((image) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.caption || ''}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {entry.insights && entry.insights.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Insights</h4>
              <div className="space-y-1">
                {entry.insights.map((insight, idx) => (
                  <p key={idx} className="text-sm text-gray-600 flex items-start">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategorySection({ section, searchTerm }: { section: any; searchTerm: string }) {
  const filteredEntries = section.entries.filter((entry: PlaybookEntry) =>
    searchTerm === '' || 
    entry.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.response.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredEntries.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 capitalize">{section.title}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">{section.description}</p>
        <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.map((entry: PlaybookEntry, index: number) => (
          <MasonryCard key={entry.id} entry={entry} index={index} />
        ))}
      </div>
    </div>
  );
} 
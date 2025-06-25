'use client';

import React, { useState, useEffect } from 'react';
import { PlaybookSection, PlaybookEntry } from '@/data/playbook';
import AudioPlayer from '@/components/media/AudioPlayer';
import VideoPlayer from '@/components/media/VideoPlayer';
import DocumentThumbnail from '@/components/media/DocumentThumbnail';

// Types for enhanced magazine content
interface MentorAnalysis {
  id: string;
  exerciseId: string;
  analysisType: 'human' | 'ai';
  mentorName?: string;
  mentorTitle?: string;
  analysis: string;
  highlights: string[];
  recommendations: string[];
  trueNorthScore?: number;
  improvementAreas: string[];
}

interface MagazineLayoutProps {
  sections: PlaybookSection[];
  userName?: string;
  userDisplayName?: string;
}

interface PracticeRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  mentorVideoUrl?: string;
  exerciseUrl: string;
}

interface MagazinePage {
  type: 'cover' | 'toc' | 'chapter-intro' | 'exercise-spread' | 'gallery' | 'milestone' | 'insights';
  content?: PlaybookEntry[];
  section?: PlaybookSection;
  title?: string;
  subtitle?: string;
  narrative?: string;
  theme?: string;
  chapterNumber?: number;
  pageNumber?: number;
  analysis?: MentorAnalysis;
  practiceRecommendations?: PracticeRecommendation[];
}

export default function BeautifulMagazine({ sections, userName = 'Your', userDisplayName }: MagazineLayoutProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // PDF Download functionality
  const downloadMagazineAsPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
             // Dynamic imports to avoid SSR issues
       const jsPDF = (await import('jspdf')).jsPDF;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title page
      pdf.setFontSize(24);
      pdf.text(`${userDisplayName || userName} Personal Development Journey`, pageWidth / 2, 40, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text('A Story of Growth, Discovery & Transformation', pageWidth / 2, 60, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 80, { align: 'center' });
      
      // Add journey summary
      const totalEntries = journeyData.totalEntries;
      const totalInsights = journeyData.allInsights.length;
      const totalThemes = journeyData.keyThemes.length;
      
      pdf.text(`${totalEntries} Assignments Completed`, pageWidth / 2, 120, { align: 'center' });
      pdf.text(`${totalInsights} Insights Gained`, pageWidth / 2, 135, { align: 'center' });
      pdf.text(`${totalThemes} Growth Areas Explored`, pageWidth / 2, 150, { align: 'center' });
      
      // Add each exercise as a page
      let pageNumber = 2;
      for (const entry of journeyData.chronological) {
        if (pageNumber > 1) pdf.addPage();
        
        // Exercise header
        pdf.setFontSize(18);
        pdf.text(entry.exerciseTitle, 20, 30);
        
        pdf.setFontSize(12);
        pdf.text(`Category: ${entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}`, 20, 45);
        pdf.text(`Date: ${formatDate(entry.completedAt)}`, 20, 55);
        
        // Exercise response
        pdf.setFontSize(11);
        const splitResponse = pdf.splitTextToSize(entry.response, pageWidth - 40);
        pdf.text(splitResponse, 20, 75);
        
        let yPosition = 75 + (splitResponse.length * 5) + 20;
        
        // Add insights if available
        if (entry.insights && entry.insights.length > 0) {
          pdf.setFontSize(14);
          pdf.text('Key Insights:', 20, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(11);
                     entry.insights.forEach((insight) => {
             const splitInsight = pdf.splitTextToSize(`• ${insight}`, pageWidth - 40);
             pdf.text(splitInsight, 25, yPosition);
             yPosition += splitInsight.length * 5 + 5;
           });
        }
        
        // Add media information
        if (entry.images?.length || entry.videos?.length || entry.audioFiles?.length || entry.documents?.length) {
          yPosition += 10;
          pdf.setFontSize(12);
          pdf.text('Media Assets:', 20, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(10);
          if (entry.images?.length) {
            pdf.text(`📸 ${entry.images.length} image(s)`, 25, yPosition);
            yPosition += 6;
          }
          if (entry.videos?.length) {
            pdf.text(`🎥 ${entry.videos.length} video(s)`, 25, yPosition);
            yPosition += 6;
          }
          if (entry.audioFiles?.length) {
            pdf.text(`🎵 ${entry.audioFiles.length} audio file(s)`, 25, yPosition);
            yPosition += 6;
          }
          if (entry.documents?.length) {
            pdf.text(`📄 ${entry.documents.length} document(s)`, 25, yPosition);
            yPosition += 6;
          }
        }
        
        // Add page number
        pdf.setFontSize(8);
        pdf.text(`Page ${pageNumber}`, pageWidth - 30, pageHeight - 10);
        pageNumber++;
      }
      
      // Save the PDF
      const fileName = `${userDisplayName || userName}_Personal_Development_Journey_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
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



  // Generate magazine pages like a professional publication
  const generatePages = (): MagazinePage[] => {
    const pages: MagazinePage[] = [];
    let pageCounter = 1;
    let chapterCounter = 1;
    
    // 1. Cover Page
    pages.push({
      type: 'cover',
      title: `${userDisplayName || userName} Personal Development Journey`,
      subtitle: 'A Story of Growth, Discovery & Transformation',
      narrative: `${journeyData.totalEntries} meaningful moments across ${journeyData.keyThemes.length} areas of growth`,
      pageNumber: pageCounter++
    });

    // 2. Table of Contents
    pages.push({
      type: 'toc',
      title: 'Table of Contents',
      content: journeyData.chronological,
      pageNumber: pageCounter++
    });

    // 3. Chapter Introduction Pages + Exercise Spreads
    journeyData.keyThemes.forEach(theme => {
      const themeEntries = journeyData.chronological.filter(e => e.category === theme);
      if (themeEntries.length === 0) return;

      // Chapter intro page
      pages.push({
        type: 'chapter-intro',
        title: theme.charAt(0).toUpperCase() + theme.slice(1),
        subtitle: `Chapter ${chapterCounter}`,
        content: themeEntries,
        theme,
        chapterNumber: chapterCounter,
        pageNumber: pageCounter++,
        narrative: `Exploring your journey in ${theme} - ${themeEntries.length} meaningful experiences`
      });

      // Exercise spreads (2-page layouts)
      themeEntries.forEach(entry => {
        pages.push({
          type: 'exercise-spread',
          title: entry.exerciseTitle,
          content: [entry],
          theme,
          chapterNumber: chapterCounter,
          pageNumber: pageCounter++
        });
      });

      chapterCounter++;
    });

    // 4. Gallery Pages
    if (journeyData.entriesWithImages.length > 0) {
      pages.push({
        type: 'gallery',
        title: 'Visual Journey',
        subtitle: 'Images that Tell Your Story',
        content: journeyData.entriesWithImages,
        pageNumber: pageCounter++
      });
    }

    // 5. Milestone Pages
    journeyData.milestones.forEach((milestone, index) => {
      pages.push({
        type: 'milestone',
        title: `Milestone ${index + 1}`,
        subtitle: milestone.exerciseTitle,
        content: [milestone],
        pageNumber: pageCounter++
      });
    });

    // 6. Insights Summary
    if (journeyData.allInsights.length > 0) {
      pages.push({
        type: 'insights',
        title: 'Key Insights',
        subtitle: 'Wisdom Gained Along the Way',
        content: journeyData.chronological,
        pageNumber: pageCounter++
      });
    }

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

  // Render Cover Page
  const renderCoverPage = (page: MagazinePage) => {
    const heroImage = journeyData.entriesWithImages[0]?.images?.[0]?.url || '/placeholder-hero.jpg';
    
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-16">
          <div className="mb-8">
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
            <h1 className="text-6xl font-bold text-white mb-4 leading-tight">
              Personal Development
            </h1>
            <h2 className="text-4xl font-light text-blue-100 mb-8">
              Journey
            </h2>
            <div className="w-32 h-1 bg-blue-400 mx-auto mb-8"></div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-2xl">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              {userDisplayName || userName}'s Growth Story
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {page.narrative}
            </p>
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{journeyData.totalEntries}</div>
                <div>Exercises</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{journeyData.keyThemes.length}</div>
                <div>Categories</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{journeyData.allInsights.length}</div>
                <div>Insights</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 text-white/80">
            <div className="text-sm">Personal Development Playbook</div>
            <div className="text-xs">{journeyData.timeSpan?.start ? formatDate(journeyData.timeSpan.start) : 'Start'} - {journeyData.timeSpan?.end ? formatDate(journeyData.timeSpan.end) : 'Present'}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render Table of Contents
  const renderTableOfContents = (page: MagazinePage) => {
    return (
      <div className="h-full bg-white flex">
        {/* Left Side - Title */}
        <div className="w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-16 flex flex-col justify-center">
          <div className="text-white">
            <h1 className="text-5xl font-bold mb-4">Table of</h1>
            <h2 className="text-4xl font-light mb-8">CONTENTS</h2>
            <div className="w-16 h-1 bg-white/60 mb-8"></div>
            <p className="text-blue-100 text-lg leading-relaxed">
              Your personal development journey organized by growth areas and meaningful moments.
            </p>
          </div>
        </div>

        {/* Right Side - Contents */}
        <div className="w-3/5 p-16">
          <div className="space-y-8">
            {journeyData.keyThemes.map((theme, index) => {
              const themeEntries = journeyData.chronological.filter(e => e.category === theme);
              const chapterNumber = index + 1;
              
              return (
                <div key={theme} className="border-l-4 border-blue-600 pl-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {chapterNumber}. {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </h3>
                      <p className="text-gray-600">
                        {themeEntries.length} meaningful experience{themeEntries.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-blue-600 font-semibold">
                      Page {3 + index * 5}
                    </div>
                  </div>
                  
                  <div className="ml-4 space-y-1">
                    {themeEntries.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="flex justify-between text-sm text-gray-500">
                        <span>{entry.exerciseTitle}</span>
                        <span>{formatDate(entry.completedAt)}</span>
                      </div>
                    ))}
                    {themeEntries.length > 3 && (
                      <div className="text-sm text-gray-400 italic">
                        +{themeEntries.length - 3} more entries...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Special Sections */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Special Features</h3>
              <div className="space-y-2 text-gray-600">
                {journeyData.entriesWithImages.length > 0 && (
                  <div className="flex justify-between">
                    <span>Visual Journey Gallery</span>
                    <span>Page {3 + journeyData.keyThemes.length * 5}</span>
                  </div>
                )}
                {journeyData.milestones.length > 0 && (
                  <div className="flex justify-between">
                    <span>Milestone Moments</span>
                    <span>Page {5 + journeyData.keyThemes.length * 5}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Key Insights Summary</span>
                  <span>Page {7 + journeyData.keyThemes.length * 5}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Chapter Introduction
  const renderChapterIntro = (page: MagazinePage) => {
    const themeEntries = page.content || [];
    const heroEntry = themeEntries.find(e => e.images && e.images.length > 0) || themeEntries[0];
    const heroImage = heroEntry?.images?.[0]?.url;

    return (
      <div className="h-full bg-white flex">
        {/* Left Side - Chapter Number & Title */}
        <div className={`w-2/5 bg-gradient-to-br ${getCategoryColor(page.theme || '')} p-16 flex flex-col justify-center relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
          </div>
          
          <div className="relative text-white">
            <div className="text-8xl font-bold mb-4 opacity-60">
              {page.chapterNumber}
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              {page.title}
            </h1>
            <div className="w-16 h-1 bg-white/60 mb-6"></div>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              {page.narrative}
            </p>
            
            <div className="space-y-2 text-white/80">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {themeEntries.length} exercises completed
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                {themeEntries.flatMap(e => e.insights || []).length} insights gained
              </div>
              {themeEntries.filter(e => e.images && e.images.length > 0).length > 0 && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                  {themeEntries.filter(e => e.images && e.images.length > 0).length} visual memories
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Preview & Stats */}
        <div className="w-3/5 p-16">
          {/* Hero Image */}
          {heroImage && (
            <div className="mb-8">
              <img 
                src={heroImage} 
                alt="Chapter preview" 
                className="w-full h-64 object-cover rounded-2xl shadow-lg"
              />
            </div>
          )}
          
          {/* Chapter Overview */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">In This Chapter</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Explore your growth in {page.title?.toLowerCase()} through meaningful exercises, 
              personal reflections, and breakthrough moments that shaped your journey.
            </p>
          </div>
          
          {/* Exercise Preview */}
          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-gray-800">Featured Exercises</h4>
            {themeEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-600">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-semibold text-gray-800">{entry.exerciseTitle}</h5>
                  <span className="text-sm text-gray-500">{formatDate(entry.completedAt)}</span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{entry.response}</p>
                {entry.insights && entry.insights.length > 0 && (
                  <div className="mt-2 flex items-center text-xs text-blue-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {entry.insights.length} key insight{entry.insights.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
            
            {themeEntries.length > 3 && (
              <div className="text-center py-4">
                <span className="text-gray-500 italic">
                  +{themeEntries.length - 3} more exercises in this chapter
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Exercise Spread (2-page layout)
  const renderExerciseSpread = (page: MagazinePage) => {
    const entry = page.content?.[0];
    if (!entry) return <div>No content</div>;

    const hasMedia = (entry.images && entry.images.length > 0) || 
                    (entry.videos && entry.videos.length > 0) || 
                    (entry.audioFiles && entry.audioFiles.length > 0);

    return (
      <div className="h-full bg-white flex">
        {/* Left Page - Content */}
        <div className="w-1/2 p-16 border-r border-gray-200">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                {entry.category}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(entry.completedAt)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 leading-tight mb-4">
              {entry.exerciseTitle}
            </h1>
            <div className="w-12 h-1 bg-blue-600 mb-6"></div>
          </div>

          {/* Response Content */}
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed text-lg rich-text-content"
              dangerouslySetInnerHTML={{ __html: entry.response }}
            />
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Page - Media & Insights */}
        <div className="w-1/2 p-16">
          {/* Media Section */}
          {hasMedia && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Visual Memories</h3>
              
              {/* Images */}
              {entry.images && entry.images.length > 0 && (
                <div className="mb-6">
                  {entry.images.length === 1 ? (
                    <img 
                      src={entry.images[0].url} 
                      alt={entry.images[0].caption || 'Exercise image'} 
                      className="w-full h-64 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {entry.images.slice(0, 4).map((image, imgIdx) => (
                        <img 
                          key={`${image.id}-exercise-${imgIdx}`} 
                          src={image.url} 
                          alt={image.caption || ''} 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  {entry.images.length > 4 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      +{entry.images.length - 4} more images
                    </p>
                  )}
                </div>
              )}
              
              {/* Videos */}
              {entry.videos && entry.videos.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <VideoPlayer 
                      src={entry.videos[0].url} 
                      title={entry.videos[0].name}
                    />
                  </div>
                  {entry.videos.length > 1 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      +{entry.videos.length - 1} more video{entry.videos.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Audio */}
              {entry.audioFiles && entry.audioFiles.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <AudioPlayer 
                      src={entry.audioFiles[0].url} 
                      title="Exercise Audio"
                    />
                  </div>
                  {entry.audioFiles.length > 1 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      +{entry.audioFiles.length - 1} more audio file{entry.audioFiles.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Insights Section */}
          {entry.insights && entry.insights.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Key Insights</h3>
              </div>

              <div className="space-y-3">
                {entry.insights.map((insight, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood Indicator */}
          {entry.mood && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
                <span className="text-2xl mr-2">
                  {entry.mood === 'accomplished' ? '🎉' : 
                   entry.mood === 'reflective' ? '🤔' : 
                   entry.mood === 'grateful' ? '🙏' : 
                   entry.mood === 'motivated' ? '🚀' : '😊'}
                </span>
                <span className="text-gray-700 font-medium capitalize">{entry.mood}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Gallery Page
  const renderGallery = (page: MagazinePage) => {
    const allImages = page.content?.flatMap(entry => entry.images || []) || [];
    
    return (
      <div className="h-full bg-white p-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{page.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{page.subtitle}</p>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-3 gap-6 h-3/4">
          {allImages.slice(0, 9).map((image, index) => (
            <div key={`${image.id}-gallery-${index}`} className={`relative overflow-hidden rounded-xl shadow-lg ${
              index === 0 ? 'col-span-2 row-span-2' : 
              index === 4 ? 'col-span-2' : ''
            }`}>
              <img 
                src={image.url} 
                alt={image.caption || ''} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">{image.caption || 'Personal moment'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allImages.length > 9 && (
          <div className="text-center mt-6">
            <span className="text-gray-500 italic">
              +{allImages.length - 9} more images in your journey
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render Milestone Page
  const renderMilestone = (page: MagazinePage) => {
    const entry = page.content?.[0];
    if (!entry) return <div>No content</div>;

    return (
      <div className="h-full bg-gradient-to-br from-amber-50 to-orange-100 p-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{page.title}</h1>
          <p className="text-xl text-orange-700 font-medium">{entry.exerciseTitle}</p>
          <div className="w-24 h-1 bg-orange-600 mx-auto mt-4"></div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            {/* Date */}
            <div className="text-center mb-8">
              <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">
                {formatDate(entry.completedAt)}
              </span>
            </div>

            {/* Story */}
            <div className="prose prose-xl max-w-none text-center mb-8">
              <p className="text-gray-700 leading-relaxed text-xl italic">
                "{entry.response}"
              </p>
            </div>

            {/* Media Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Images */}
              {entry.images && entry.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Visual Memory</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {entry.images.slice(0, 4).map((image, imgIdx) => (
                      <img 
                        key={`${image.id}-milestone-${imgIdx}`}
                        src={image.url} 
                        alt={image.caption || 'Milestone moment'} 
                        className="w-full h-24 object-cover rounded-lg shadow-md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {entry.videos && entry.videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Video Reflection</h3>
                  <VideoPlayer src={entry.videos[0].url} title={entry.videos[0].name} />
                </div>
              )}

              {/* Audio */}
              {entry.audioFiles && entry.audioFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Audio Insight</h3>
                  <AudioPlayer src={entry.audioFiles[0].url} title={entry.audioFiles[0].name} />
                </div>
              )}

              {/* Documents */}
              {entry.documents && entry.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Supporting Documents</h3>
                  <div className="space-y-2">
                    {entry.documents.slice(0, 2).map(doc => (
                      <DocumentThumbnail key={doc.id} document={doc} showDownload={true} showRemove={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Insights */}
            {entry.insights && entry.insights.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
                  What This Moment Taught Me
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entry.insights.map((insight, index) => (
                    <div key={index} className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-600">
                      <p className="text-gray-700 font-medium">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Insights Summary
  const renderInsights = (page: MagazinePage) => {
    const allInsights = page.content?.flatMap(entry => entry.insights || []) || [];
    const categories = [...new Set(page.content?.map(entry => entry.category) || [])];

    return (
      <div className="h-full bg-white p-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{page.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{page.subtitle}</p>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>

        {/* Insights by Category */}
        <div className="grid grid-cols-2 gap-8 h-3/4">
          {categories.map((category) => {
            const categoryEntries = page.content?.filter(entry => entry.category === category) || [];
            const categoryInsights = categoryEntries.flatMap(entry => entry.insights || []);
            
            return (
              <div key={category} className="bg-gray-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 capitalize">{category}</h2>
                <div className="space-y-4">
                  {categoryInsights.slice(0, 5).map((insight, insightIndex) => (
                    <div key={insightIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                  {categoryInsights.length > 5 && (
                    <p className="text-gray-500 italic text-sm">
                      +{categoryInsights.length - 5} more insights...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-8 bg-blue-50 rounded-2xl px-8 py-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{allInsights.length}</div>
              <div className="text-gray-600">Total Insights</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
              <div className="text-gray-600">Growth Areas</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{page.content?.length || 0}</div>
              <div className="text-gray-600">Exercises</div>
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
          <div className="flex-1 relative overflow-hidden">
            <div className="h-full columns-3 gap-4 space-y-4 overflow-y-auto">
              {allImages.map((image, index) => (
                <div key={`${image.id}-${index}`} className="break-inside-avoid relative group">
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

  const renderMilestoneGradient = (page: MagazinePage) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {entry.images && entry.images.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">Images</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {entry.images.slice(0, 4).map((image, imgIdx) => (
                        <img key={`${image.id}-milestone-${imgIdx}`} src={image.url} alt={image.caption || ''} className="w-full h-24 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
                
                {entry.videos && entry.videos.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">Video</h4>
                    <VideoPlayer src={entry.videos[0].url} title={entry.videos[0].name} />
                  </div>
                )}
                
                {entry.audioFiles && entry.audioFiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">Audio</h4>
                    <AudioPlayer src={entry.audioFiles[0].url} title={entry.audioFiles[0].name} />
                  </div>
                )}
                
                {entry.documents && entry.documents.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">Documents</h4>
                    <div className="space-y-2">
                      {entry.documents.slice(0, 2).map(doc => (
                        <DocumentThumbnail key={doc.id} document={doc} showDownload={true} showRemove={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
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
                  {entry.images?.slice(0, 2).map((image, imgIdx) => (
                    <img key={`${image.id}-reflection-${imgIdx}`} src={image.url} alt={image.caption || ''} className="w-full h-20 object-cover rounded-lg" />
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
                        {entry.images?.slice(0, 4).map((image, imgIdx) => (
                          <img key={`${image.id}-growth-${index}-${imgIdx}`} src={image.url} alt={image.caption || ''} className="w-full h-24 object-cover rounded-lg" />
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

  const renderJournalEntry = (page: MagazinePage) => {
    const entry = page.content?.[0];
    const analysis = page.analysis;
    const practiceRecommendations = page.practiceRecommendations;
    if (!entry || !analysis) return null;

    return (
      <div className="h-full bg-gradient-to-br from-white to-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-block px-4 py-2 rounded-full text-white text-sm font-medium mb-4 bg-gradient-to-r ${getCategoryColor(entry.category)}`}>
              {entry.category.toUpperCase()}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
            <p className="text-lg text-gray-600">{formatDate(entry.completedAt)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - User's Work */}
            <div className="lg:col-span-2 space-y-8">
              {/* User Response */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Reflection</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg">{entry.response}</p>
                </div>
              </div>

              {/* Media Content */}
              {(entry.images?.length || entry.videos?.length || entry.audioFiles?.length || entry.documents?.length) && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Uploads</h2>
                  
                  {/* Images */}
                  {entry.images && entry.images.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Images</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {entry.images.map((image, imgIdx) => (
                          <div key={`${image.id}-journal-${imgIdx}`} className="relative group">
                            <img 
                              src={image.url} 
                              alt={image.caption || image.name}
                              className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            />
                            {image.caption && (
                              <p className="mt-2 text-sm text-gray-600 italic">{image.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {entry.videos && entry.videos.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Videos</h3>
                      <div className="space-y-4">
                        {entry.videos.map((video, vidIdx) => (
                          <div key={`${video.id}-journal-${vidIdx}`} className="bg-gray-50 rounded-lg p-4">
                            <VideoPlayer src={video.url} title={video.name} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio */}
                  {entry.audioFiles && entry.audioFiles.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Audio Reflections</h3>
                      <div className="space-y-4">
                        {entry.audioFiles.map((audio, audIdx) => (
                          <div key={`${audio.id}-journal-${audIdx}`} className="bg-gray-50 rounded-lg p-4">
                            <AudioPlayer src={audio.url} title={audio.name} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {entry.documents && entry.documents.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {entry.documents.map((doc, docIdx) => (
                          <div key={`${doc.id}-journal-${docIdx}`}>
                            <DocumentThumbnail document={doc} showDownload={true} showRemove={false} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Analysis & Practice */}
            <div className="space-y-6">
              {/* Mentor Analysis */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mentor Analysis</h3>
                    <p className="text-sm text-gray-600">{analysis.mentorName} • {analysis.mentorTitle}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 leading-relaxed">{analysis.analysis}</p>
                  </div>

                  {/* True North Score */}
                  {analysis.trueNorthScore && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">True North Score</span>
                        <span className="text-2xl font-bold text-green-600">{analysis.trueNorthScore}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full"
                          style={{ width: `${analysis.trueNorthScore}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvement Areas */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                    <ul className="space-y-1">
                      {analysis.improvementAreas.map((area, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Practice More Section */}
              {practiceRecommendations && practiceRecommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900">Practice More</h3>
                  </div>

                  <div className="space-y-4">
                    {practiceRecommendations.map((rec) => (
                      <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            rec.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {rec.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">⏱️ {rec.estimatedTime}</span>
                          <div className="space-x-2">
                            {rec.mentorVideoUrl && (
                              <button className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
                                Watch Guide
                              </button>
                            )}
                            <button className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors">
                              Start Exercise
                            </button>
                          </div>
                        </div>
                      </div>
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

  const renderPage = (page: MagazinePage) => {
    switch (page.type) {
      case 'cover':
        return renderCoverPage(page);
      case 'toc':
        return renderTableOfContents(page);
      case 'chapter-intro':
        return renderChapterIntro(page);
      case 'exercise-spread':
        return renderExerciseSpread(page);
      case 'gallery':
        return renderGallery(page);
      case 'milestone':
        return renderMilestone(page);
      case 'insights':
        return renderInsights(page);
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

             {/* Page Indicator & Download Button */}
       <div className="absolute top-8 right-8 flex items-center space-x-4">
         <button
           onClick={downloadMagazineAsPDF}
           disabled={isGeneratingPDF}
           className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
         >
           {isGeneratingPDF ? (
             <>
               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span>Generating PDF...</span>
             </>
           ) : (
             <>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <span>Download PDF</span>
             </>
           )}
         </button>
         <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
           <span className="text-white text-sm font-medium">{pages[currentPage]?.title}</span>
         </div>
       </div>
    </div>
  );
} 
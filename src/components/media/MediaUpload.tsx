'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Image,
  Videocam,
  Mic,
  Description,
  CloudUpload,
  Delete,
} from '@mui/icons-material';
import ImageUpload, { ImageData } from './ImageUpload';
import VideoRecordUpload, { VideoData } from './VideoRecordUpload';
import DocumentThumbnail, { DocumentData } from './DocumentThumbnail';
import AudioPlayer from './AudioPlayer';
import { storageService } from '@/lib/storage-service';

interface AudioData {
  id: string;
  name: string;
  url: string;
  duration?: number;
  size?: number;
  type?: string;
  s3Key?: string;
  metadata?: Record<string, unknown>;
}

interface MediaUploadProps {
  images?: ImageData[];
  videos?: VideoData[];
  audioFiles?: AudioData[];
  documents?: DocumentData[];
  onImagesChange?: (images: ImageData[]) => void;
  onVideosChange?: (videos: VideoData[]) => void;
  onAudioFilesChange?: (audioFiles: AudioData[]) => void;
  onDocumentsChange?: (documents: DocumentData[]) => void;
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: string;
  mood?: string;
  tags?: string[];
  enabledTypes?: ('images' | 'videos' | 'audio' | 'documents')[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function MediaUpload({
  images = [],
  videos = [],
  audioFiles = [],
  documents = [],
  onImagesChange,
  onVideosChange,
  onAudioFilesChange,
  onDocumentsChange,
  exerciseId,
  exerciseTitle,
  category,
  responseType,
  mood,
  tags = [],
  enabledTypes = ['images', 'videos', 'audio', 'documents']
}: MediaUploadProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAudioUpload = async (files: FileList | File[]) => {
    if (!onAudioFilesChange) return;

    const fileArray = Array.from(files);
    const newAudioFiles: AudioData[] = [];

    for (const file of fileArray) {
      try {
        const uploadOptions = {
          exerciseId,
          exerciseTitle,
          category,
          responseType,
          mood,
          tags
        };

        const result = await storageService.uploadPlaybookAsset(file, uploadOptions);
        
        newAudioFiles.push({
          id: result.key,
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          s3Key: result.key,
          metadata: {
            userId: 'user-id',
            exerciseId,
            category,
            uploadDate: new Date().toISOString(),
            fileType: file.type,
            originalName: file.name
          }
        });
      } catch (error) {
        console.error('Failed to upload audio file:', error);
      }
    }

    if (newAudioFiles.length > 0) {
      onAudioFilesChange([...audioFiles, ...newAudioFiles]);
    }
  };

  const handleDocumentUpload = async (files: FileList | File[]) => {
    if (!onDocumentsChange) return;

    const fileArray = Array.from(files);
    const newDocuments: DocumentData[] = [];

    for (const file of fileArray) {
      try {
        const uploadOptions = {
          exerciseId,
          exerciseTitle,
          category,
          responseType,
          mood,
          tags
        };

        const result = await storageService.uploadPlaybookAsset(file, uploadOptions);
        
        newDocuments.push({
          id: result.key,
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          s3Key: result.key,
          metadata: {
            userId: 'user-id',
            exerciseId,
            category,
            uploadDate: new Date().toISOString(),
            fileType: file.type,
            originalName: file.name
          }
        });
      } catch (error) {
        console.error('Failed to upload document:', error);
      }
    }

    if (newDocuments.length > 0) {
      onDocumentsChange([...documents, ...newDocuments]);
    }
  };

  const tabsData = [
    { 
      id: 'images', 
      label: 'Images', 
      icon: <Image />, 
      enabled: enabledTypes.includes('images') 
    },
    { 
      id: 'videos', 
      label: 'Videos', 
      icon: <Videocam />, 
      enabled: enabledTypes.includes('videos') 
    },
    { 
      id: 'audio', 
      label: 'Audio', 
      icon: <Mic />, 
      enabled: enabledTypes.includes('audio') 
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: <Description />, 
      enabled: enabledTypes.includes('documents') 
    },
  ].filter(tab => tab.enabled);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add Media
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {tabsData.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Images Tab */}
      {enabledTypes.includes('images') && (
        <TabPanel value={activeTab} index={tabsData.findIndex(tab => tab.id === 'images')}>
          <ImageUpload
            images={images}
            onImagesChange={onImagesChange || (() => {})}
            exerciseId={exerciseId}
            exerciseTitle={exerciseTitle}
            category={category}
            responseType={responseType as any}
            mood={mood}
            tags={tags}
          />
        </TabPanel>
      )}

      {/* Videos Tab */}
      {enabledTypes.includes('videos') && (
        <TabPanel value={activeTab} index={tabsData.findIndex(tab => tab.id === 'videos')}>
          <VideoRecordUpload
            videos={videos}
            onVideosChange={onVideosChange || (() => {})}
            exerciseId={exerciseId}
            exerciseTitle={exerciseTitle}
            category={category}
            responseType={responseType as any}
            mood={mood}
            tags={tags}
          />
        </TabPanel>
      )}

             {/* Audio Tab */}
       {enabledTypes.includes('audio') && (
         <TabPanel value={activeTab} index={tabsData.findIndex(tab => tab.id === 'audio')}>
           <Box>
             <Button
               variant="outlined"
               component="label"
               startIcon={<CloudUpload />}
               sx={{ mb: 2 }}
             >
               Upload Audio Files
               <input
                 type="file"
                 hidden
                 multiple
                 accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                 onChange={(e) => e.target.files && handleAudioUpload(e.target.files)}
               />
             </Button>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
               Supported formats: MP3, WAV, OGG, M4A, AAC, FLAC
             </Typography>
             
             <Stack spacing={2}>
               {audioFiles.map((audio) => (
                 <Box key={audio.id}>
                   <AudioPlayer
                     src={audio.url}
                     title={audio.name}
                   />
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                     <Typography variant="caption" color="text.secondary">
                       {audio.size && `${(audio.size / 1024 / 1024).toFixed(2)} MB`}
                     </Typography>
                     <IconButton
                       size="small"
                       color="error"
                       onClick={() => {
                         if (onAudioFilesChange) {
                           onAudioFilesChange(audioFiles.filter(a => a.id !== audio.id));
                         }
                       }}
                     >
                       <Delete />
                     </IconButton>
                   </Box>
                 </Box>
               ))}
             </Stack>
           </Box>
         </TabPanel>
       )}

       {/* Documents Tab */}
       {enabledTypes.includes('documents') && (
         <TabPanel value={activeTab} index={tabsData.findIndex(tab => tab.id === 'documents')}>
           <Box>
             <Button
               variant="outlined"
               component="label"
               startIcon={<CloudUpload />}
               sx={{ mb: 2 }}
             >
               Upload Documents
               <input
                 type="file"
                 hidden
                 multiple
                 accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx"
                 onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
               />
             </Button>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
               Supported formats: PDF, Word, Excel, PowerPoint, Text files, and more
             </Typography>
             
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
               {documents.map((document) => (
                 <DocumentThumbnail
                   key={document.id}
                   document={document}
                   showDownload={true}
                   showRemove={true}
                   onRemove={(id) => {
                     if (onDocumentsChange) {
                       onDocumentsChange(documents.filter(doc => doc.id !== id));
                     }
                   }}
                 />
               ))}
             </Box>
           </Box>
         </TabPanel>
       )}
    </Paper>
  );
} 
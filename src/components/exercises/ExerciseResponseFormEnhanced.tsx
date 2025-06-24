'use client';

import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { calculateExerciseProgress } from '@/utils/exerciseProgress';
import ExerciseProgress from './ExerciseProgress';
import VideoRecordUpload, { VideoData } from '@/components/media/VideoRecordUpload';
import AudioPlayerWrapper from '@/components/media/AudioPlayerWrapper';
import DocumentUpload from '@/components/media/DocumentUpload';
import { DocumentData } from '@/components/media/DocumentThumbnail';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description: string;
  question: string;
  instructions?: string;
  requireText: 'not_required' | 'required' | 'or';
  requireImage: 'not_required' | 'required' | 'or';
  requireAudio: 'not_required' | 'required' | 'or';
  requireVideo: 'not_required' | 'required' | 'or';
  requireDocument: 'not_required' | 'required' | 'or';
  textPrompt?: string;
  maxTextLength?: number;
  allowMultipleImages: boolean;
  allowMultipleDocuments: boolean;
}

interface ExerciseResponse {
  id: string;
  status: 'draft' | 'completed';
  responseText?: string;
  imageS3Keys?: string[];
  audioS3Key?: string;
  videoS3Key?: string;
  videoS3Keys?: string[];
  documentS3Keys?: string[];
  notes?: string;
  createdAt?: string;
}

interface ResponseData {
  exerciseId: string;
  userId: string;
  status: 'draft' | 'completed';
  responseText?: string;
  imageS3Keys?: string[];
  audioS3Key?: string;
  videoS3Key?: string;
  documentS3Keys?: string[];
  timeSpentSeconds?: number;
  completedAt?: string;
}

interface ExerciseResponseFormEnhancedProps {
  exercise: Exercise;
  existingResponse?: ExerciseResponse;
  onSave?: (response: unknown) => void;
  onComplete?: (response: unknown) => void;
  onCancel?: () => void;
}

export default function ExerciseResponseFormEnhanced({ 
  exercise, 
  existingResponse, 
  onSave, 
  onComplete, 
  onCancel 
}: ExerciseResponseFormEnhancedProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  const [response, setResponse] = useState(() => {
    // Convert saved video S3 keys back to VideoData objects
    const savedVideoKeys = existingResponse?.videoS3Keys || (existingResponse?.videoS3Key ? [existingResponse.videoS3Key] : []);
    console.log('Loading existing response:', existingResponse);
    console.log('Found saved video keys:', savedVideoKeys);
    
    const savedVideos: VideoData[] = savedVideoKeys.map((s3Key, index) => ({
      id: s3Key,
      name: `Saved Video ${index + 1}`,
      url: '', // Will be populated by VideoPlayer component using getUrl
      s3Key: s3Key,
      type: 'video/mp4', // Default type
      metadata: {
        fromDatabase: true,
        uploadDate: existingResponse?.createdAt || new Date().toISOString()
      }
    }));
    
    console.log('Created saved videos:', savedVideos);

    // Convert saved document S3 keys back to DocumentData objects
    const savedDocumentKeys = existingResponse?.documentS3Keys || [];
    const savedDocuments: DocumentData[] = savedDocumentKeys.map((s3Key, index) => {
      // Extract filename from S3 key (format: users/{userId}/playbook/documents/{filename})
      const fileName = s3Key.split('/').pop() || `Saved Document ${index + 1}`;
      
      // Determine file type from extension
      const getFileTypeFromName = (name: string): string => {
        const extension = name.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'pdf': return 'application/pdf';
          case 'doc': return 'application/msword';
          case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          case 'txt': return 'text/plain';
          case 'rtf': return 'application/rtf';
          case 'odt': return 'application/vnd.oasis.opendocument.text';
          default: return 'application/octet-stream';
        }
      };

      return {
        id: s3Key,
        name: fileName,
        url: '', // Will be populated by DocumentThumbnailWrapper using getUrl
        s3Key: s3Key,
        type: getFileTypeFromName(fileName),
        size: 0, // Size not available from S3 key, would need separate API call
        metadata: {
          fromDatabase: true,
          uploadDate: existingResponse?.createdAt || new Date().toISOString()
        }
      };
    });

    return {
      responseText: existingResponse?.responseText || '',
      imageFiles: [] as File[],
      audioFile: null as File | null,
      videos: savedVideos,
      documents: savedDocuments,
      imageS3Keys: existingResponse?.imageS3Keys || [],
      audioS3Key: existingResponse?.audioS3Key || '',
      videoS3Key: savedVideoKeys[0] || '', // Use single video key
      videoS3Keys: savedVideoKeys,
      documentS3Keys: savedDocumentKeys,
    };
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  // Check if assignment is completed (read-only mode)
  const isCompleted = existingResponse?.status === 'completed';

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Validation to check if all required fields are filled
  const validateRequiredFields = () => {
    // Use the same logic as calculateExerciseProgress for consistency
    const requirements = {
      requireText: exercise.requireText,
      requireImage: exercise.requireImage,
      requireAudio: exercise.requireAudio,
      requireVideo: exercise.requireVideo,
      requireDocument: exercise.requireDocument,
      instructions: exercise.instructions
    };

    const currentResponse = {
      textResponse: response.responseText,
      imageUrls: [...response.imageS3Keys, ...response.imageFiles.map(f => f.name)],
      audioUrl: response.audioS3Key || (response.audioFile ? 'pending' : ''),
      videoUrl: response.videoS3Keys[0] || (response.videos.length > 0 ? 'pending' : ''),
      documentUrls: [...new Set([...response.documentS3Keys, ...response.documents.map(d => d.s3Key || d.id).filter(Boolean)])],
    };

    const progress = calculateExerciseProgress(requirements, currentResponse, existingResponse?.status);
    
    // If not complete, return the missing requirements from the progress calculation
    if (!progress.hasAllRequirements) {
      return progress.missingRequirements;
    }

    return [];
  };

  // File upload helper
  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const key = `${prefix}/${user?.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    try {
      const result = await uploadData({
        key,
        data: file,
        options: {
          onProgress: (progress) => {
            const percentage = progress.totalBytes 
              ? Math.round((progress.transferredBytes / progress.totalBytes) * 100)
              : 0;
            setUploadProgress(prev => ({ ...prev, [file.name]: percentage }));
          }
        }
      }).result;

      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[file.name];
        return updated;
      });

      return result.key;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  };

  // Audio recording functions
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `audio-${Date.now()}.wav`, { type: 'audio/wav' });
        setResponse(prev => ({ ...prev, audioFile: file }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start audio recording. Please check your microphone permissions.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Handle file inputs
  const handleImageFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (exercise.allowMultipleImages) {
      setResponse(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...validFiles] }));
    } else {
      setResponse(prev => ({ ...prev, imageFiles: validFiles.slice(0, 1) }));
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Upload files and collect the keys
      const uploadedImageKeys: string[] = [];
      const uploadedDocumentKeys: string[] = [];
      const uploadedVideoKeys: string[] = [];
      let uploadedAudioKey = '';

      // Upload images
      if (response.imageFiles.length > 0) {
        const imageUploadPromises = response.imageFiles.map(async (file) => {
          const key = await uploadFile(file, 'exercise-responses/images');
          uploadedImageKeys.push(key);
          
          // Save asset metadata to database
          try {
            await fetch('/api/media/save-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                s3Key: key,
                fileName: file.name,
                fileType: 'image',
                fileSize: file.size,
                mimeType: file.type,
                exerciseId: exercise.id,
                category: 'exercise-response'
              })
            });
          } catch (error) {
            console.error('Failed to save image asset metadata:', error);
          }
          
          return key;
        });
        await Promise.all(imageUploadPromises);
      }

      // Upload audio
      if (response.audioFile) {
        uploadedAudioKey = await uploadFile(response.audioFile, 'exercise-responses/audio');
        
        // Save audio asset metadata to database
        try {
          await fetch('/api/media/save-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              s3Key: uploadedAudioKey,
              fileName: response.audioFile.name,
              fileType: 'audio',
              fileSize: response.audioFile.size,
              mimeType: response.audioFile.type,
              exerciseId: exercise.id,
              category: 'exercise-response'
            })
          });
        } catch (error) {
          console.error('Failed to save audio asset metadata:', error);
        }
      }

      // Upload videos (from VideoRecordUpload component)
      console.log('Processing videos for save:', response.videos);
      for (const video of response.videos) {
        console.log('Video data:', video);
        if (video.s3Key) {
          console.log('Adding video s3Key:', video.s3Key);
          uploadedVideoKeys.push(video.s3Key);
        } else if (video.id) {
          // Fallback: use video.id if s3Key is not set
          console.log('Using video.id as key:', video.id);
          uploadedVideoKeys.push(video.id);
        }
      }

      // Upload documents (from DocumentUpload component) 
      for (const document of response.documents) {
        if (document.s3Key) {
          uploadedDocumentKeys.push(document.s3Key);
        }
      }

      // Combine existing and newly uploaded keys
      const finalImageS3Keys = [...response.imageS3Keys, ...uploadedImageKeys];
      const finalDocumentS3Keys = [...response.documentS3Keys, ...uploadedDocumentKeys];
      const finalVideoS3Keys = [
        ...(response.videoS3Key ? [response.videoS3Key] : []), // Use existing single video
        ...uploadedVideoKeys
      ];
      const finalAudioS3Key = response.audioS3Key || uploadedAudioKey;

      // Save response as draft with all uploaded media
      const responseData: ResponseData = {
        exerciseId: exercise.id,
        userId: user?.userId || '',
        status: 'draft' as const,
      };
      
      // Add optional fields only if they have values
      if (response.responseText?.trim()) {
        responseData.responseText = response.responseText.trim();
      }
      
      if (finalVideoS3Keys.length > 0) {
        // Use single video key since videoS3Keys array is not deployed
        responseData.videoS3Key = finalVideoS3Keys[0];
        console.log('⚠️ Using videoS3Key (single) instead of videoS3Keys array due to schema deployment issue');
      }
      
      if (finalImageS3Keys.length > 0) {
        responseData.imageS3Keys = finalImageS3Keys;
      }
      
      if (finalDocumentS3Keys.length > 0) {
        responseData.documentS3Keys = finalDocumentS3Keys;
      }
      
      if (finalAudioS3Key) {
        responseData.audioS3Key = finalAudioS3Key;
      }
      
      // Add metadata
      responseData.timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

      console.log('💾 Saving draft response data:', responseData);
      console.log('📹 Final video S3 keys:', finalVideoS3Keys);
      console.log('👤 User ID being used:', user?.userId);
      console.log('🏃 Exercise ID being used:', exercise.id);
      console.log('📊 All response data fields:', Object.keys(responseData));
      console.log('📝 Response data JSON:', JSON.stringify(responseData, null, 2));

      let savedResponse;
      if (existingResponse?.id) {
        console.log('Updating existing response with ID:', existingResponse.id);
        // For updates, don't send immutable fields like exerciseId and userId
        const updateData = { ...responseData };
        delete updateData.exerciseId;
        delete updateData.userId;
        console.log('Update data (without immutable fields):', updateData);
        savedResponse = await client.models.ExerciseResponse.update({
          id: existingResponse.id,
          ...updateData,
        });
      } else {
        console.log('Creating new response with data:', responseData);
        savedResponse = await client.models.ExerciseResponse.create(responseData);
      }

      console.log('Response saved successfully:', savedResponse);
      console.log('Saved response details:', JSON.stringify(savedResponse, null, 2));
      
      // Check for errors in the response
      if (savedResponse.errors && savedResponse.errors.length > 0) {
        console.error('❌ Database save errors (full details):', JSON.stringify(savedResponse.errors, null, 2));
        console.error('❌ Error messages:', savedResponse.errors.map(e => e.message));
        console.error('❌ Error types:', savedResponse.errors.map(e => e.errorType));
        setError(`Failed to save: ${savedResponse.errors.map(e => e.message).join(', ')}`);
        return;
      }
      
      // Update local state with the saved S3 keys to prevent re-uploading
      setResponse(prev => ({
        ...prev,
        imageS3Keys: finalImageS3Keys,
        documentS3Keys: finalDocumentS3Keys,
        videoS3Key: finalVideoS3Keys[0], // Use single video key
        audioS3Key: finalAudioS3Key,
        imageFiles: [], // Clear uploaded files since they're now in S3
        audioFile: null, // Clear uploaded audio since it's now in S3
      }));

      onSave?.(savedResponse);
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete exercise
  const handleComplete = async () => {
    try {
      setError(null);
      
      // Validate required fields before allowing completion
      const validationErrors = validateRequiredFields();
      console.log('Validation check:', { validationErrors, hasErrors: validationErrors.length > 0 });
      if (validationErrors.length > 0) {
        setError(`Please complete all requirements: ${validationErrors.join(', ')}`);
        return;
      }

      setIsLoading(true);

      // Upload files and collect the keys (same as draft)
      const uploadedImageKeys: string[] = [];
      const uploadedDocumentKeys: string[] = [];
      const uploadedVideoKeys: string[] = [];
      let uploadedAudioKey = '';

      // Upload images
      if (response.imageFiles.length > 0) {
        const imageUploadPromises = response.imageFiles.map(async (file) => {
          const key = await uploadFile(file, 'exercise-responses/images');
          uploadedImageKeys.push(key);
          
          // Save asset metadata to database
          try {
            await fetch('/api/media/save-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                s3Key: key,
                fileName: file.name,
                fileType: 'image',
                fileSize: file.size,
                mimeType: file.type,
                exerciseId: exercise.id,
                category: 'exercise-response'
              })
            });
          } catch (error) {
            console.error('Failed to save image asset metadata:', error);
          }
          
          return key;
        });
        await Promise.all(imageUploadPromises);
      }

      // Upload audio
      if (response.audioFile) {
        uploadedAudioKey = await uploadFile(response.audioFile, 'exercise-responses/audio');
        
        // Save audio asset metadata to database
        try {
          await fetch('/api/media/save-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              s3Key: uploadedAudioKey,
              fileName: response.audioFile.name,
              fileType: 'audio',
              fileSize: response.audioFile.size,
              mimeType: response.audioFile.type,
              exerciseId: exercise.id,
              category: 'exercise-response'
            })
          });
        } catch (error) {
          console.error('Failed to save audio asset metadata:', error);
        }
      }

      console.log('Processing videos for complete:', response.videos);
      for (const video of response.videos) {
        console.log('Video data for complete:', video);
        if (video.s3Key) {
          console.log('Adding video s3Key for complete:', video.s3Key);
          uploadedVideoKeys.push(video.s3Key);
        } else if (video.id) {
          // Fallback: use video.id if s3Key is not set
          console.log('Using video.id as key for complete:', video.id);
          uploadedVideoKeys.push(video.id);
        }
      }

      for (const document of response.documents) {
        if (document.s3Key) {
          uploadedDocumentKeys.push(document.s3Key);
        }
      }

      // Combine existing and newly uploaded keys
      const finalImageS3Keys = [...response.imageS3Keys, ...uploadedImageKeys];
      const finalDocumentS3Keys = [...response.documentS3Keys, ...uploadedDocumentKeys];
      const finalVideoS3Keys = [
        ...(response.videoS3Key ? [response.videoS3Key] : []), // Use existing single video
        ...uploadedVideoKeys
      ];
      const finalAudioS3Key = response.audioS3Key || uploadedAudioKey;

      // Create complete response with all media assets
      const responseData: ResponseData = {
        exerciseId: exercise.id,
        userId: user?.userId || '',
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
      };
      
      // Add uploaded media
      if (response.responseText?.trim()) {
        responseData.responseText = response.responseText.trim();
      }
      
      if (finalVideoS3Keys.length > 0) {
        // Use single video key since videoS3Keys array is not deployed
        responseData.videoS3Key = finalVideoS3Keys[0];
        console.log('⚠️ Using videoS3Key (single) instead of videoS3Keys array due to schema deployment issue');
      }
      
      if (finalImageS3Keys.length > 0) {
        responseData.imageS3Keys = finalImageS3Keys;
      }
      
      if (finalDocumentS3Keys.length > 0) {
        responseData.documentS3Keys = finalDocumentS3Keys;
      }
      
      if (finalAudioS3Key) {
        responseData.audioS3Key = finalAudioS3Key;
      }
      
      console.log('Saving complete response with all media:', responseData);

      console.log('Saving completed response data:', responseData);
      console.log('Final video S3 keys for completed:', finalVideoS3Keys);
      console.log('User ID being used for complete:', user?.userId);
      console.log('Exercise ID being used for complete:', exercise.id);

      let savedResponse;
      if (existingResponse?.id) {
        console.log('Updating existing response for complete with ID:', existingResponse.id);
        // For updates, don't send immutable fields like exerciseId and userId
        const updateData = { ...responseData };
        delete updateData.exerciseId;
        delete updateData.userId;
        console.log('Update data for complete (without immutable fields):', updateData);
        savedResponse = await client.models.ExerciseResponse.update({
          id: existingResponse.id,
          ...updateData,
        });
      } else {
        console.log('Creating new response for complete with data:', responseData);
        savedResponse = await client.models.ExerciseResponse.create(responseData);
      }

      console.log('Complete response saved successfully:', savedResponse);
      console.log('Complete saved response details:', JSON.stringify(savedResponse, null, 2));
      
      // Check for errors in the response
      if (savedResponse.errors && savedResponse.errors.length > 0) {
        console.error('❌ Database complete save errors (full details):', JSON.stringify(savedResponse.errors, null, 2));
        console.error('❌ Complete error messages:', savedResponse.errors.map(e => e.message));
        console.error('❌ Complete error types:', savedResponse.errors.map(e => e.errorType));
        setError(`Failed to complete assignment: ${savedResponse.errors.map(e => e.message).join(', ')}`);
        return;
      }

      // Update local state with the saved S3 keys  
      setResponse(prev => ({
        ...prev,
        imageS3Keys: finalImageS3Keys,
        documentS3Keys: finalDocumentS3Keys,
        videoS3Key: finalVideoS3Keys[0], // Use single video key
        audioS3Key: finalAudioS3Key,
        imageFiles: [], // Clear uploaded files since they're now in S3
        audioFile: null, // Clear uploaded audio since it's now in S3
      }));

      // Create playbook entry for completed exercise directly using Amplify
      try {
        console.log('Creating playbook entry for completed exercise...');
        const playbookEntry = await client.models.PlaybookEntry.create({
          userId: user?.userId || '',
          exerciseResponseId: savedResponse.data?.id || undefined,
          title: exercise.title,
          content: response.responseText || 'Exercise completed',
          category: 'reflection', // Default category for exercises
          insights: JSON.stringify([]), // Store as JSON string
          audioS3Keys: finalAudioS3Key ? [finalAudioS3Key] : [],
          videoS3Keys: finalVideoS3Keys || [],
          imageS3Keys: finalImageS3Keys || [],
          documentS3Keys: finalDocumentS3Keys || [],
          s3Bucket: 'north-playbook',
          mood: 'accomplished',
          tags: ['exercise', 'completed', exercise.title?.toLowerCase()?.replace(/\s+/g, '-') || 'exercise'],
          isHighlight: true,
          viewCount: 0
        });

        if (playbookEntry.data) {
          console.log('✅ Playbook entry created successfully:', playbookEntry.data.id);
        } else {
          console.warn('⚠️ Failed to create playbook entry, but exercise was completed successfully');
        }
      } catch (playbookError) {
        console.error('Error creating playbook entry:', playbookError);
        // Don't fail the exercise completion if playbook creation fails
      }

      onComplete?.(savedResponse);
    } catch (error) {
      console.error('Error completing exercise:', error);
              setError('Failed to complete assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeFile = (type: 'image', index: number) => {
    if (type === 'image') {
      setResponse(prev => ({
        ...prev,
        imageFiles: prev.imageFiles.filter((_, i) => i !== index)
      }));
    }
  };

  const getImageUrl = async (s3Key: string): Promise<string> => {
    try {
      const result = await getUrl({ key: s3Key });
      const url = result.url;
      return url.toString();
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '';
    }
  };

  const ImagePreview = ({ s3Key, index }: { s3Key: string; index: number }) => {
    const [imageUrl, setImageUrl] = useState<string>('');

    React.useEffect(() => {
      getImageUrl(s3Key).then(setImageUrl);
    }, [s3Key]);

    if (!imageUrl) return <div className="w-32 h-32 bg-gray-200 rounded animate-pulse" />;

    return (
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={`Uploaded image ${index + 1}`}
          className="w-32 h-32 object-cover rounded border"
        />
        {!isCompleted && (
          <button
            onClick={() => {
              setResponse(prev => ({
                ...prev,
                imageS3Keys: prev.imageS3Keys.filter((_, i) => i !== index)
              }));
            }}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{exercise.title}</h1>
        <div 
          className="text-gray-600 mt-2 prose max-w-none rich-text-content"
          dangerouslySetInnerHTML={{ __html: exercise.description }}
        />
      </div>

      {/* Question */}
      <div className="mb-6">
        <div 
          className="text-xl font-semibold text-gray-900 mb-3 prose prose-lg max-w-none rich-text-content"
          dangerouslySetInnerHTML={{ __html: exercise.question }}
        />
      </div>

      {/* Instructions (after question) */}
      {exercise.instructions && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
          <div 
            className="text-blue-800 rich-text-content"
            style={{
              wordWrap: 'break-word',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: exercise.instructions }}
          />
        </div>
      )}

      {/* Progress Tracker */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <ExerciseProgress
          requirements={{
            requireText: exercise.requireText,
            requireImage: exercise.requireImage,
            requireAudio: exercise.requireAudio,
            requireVideo: exercise.requireVideo,
            requireDocument: exercise.requireDocument,
          }}
          response={{
            textResponse: response.responseText,
            imageUrls: [...response.imageS3Keys, ...response.imageFiles.map(f => f.name)],
            audioUrl: response.audioS3Key || (response.audioFile ? 'pending' : ''),
            videoUrl: response.videoS3Keys[0] || (response.videos.length > 0 ? 'pending' : ''),
            documentUrls: [...new Set([...response.documentS3Keys, ...response.documents.map(d => d.s3Key || d.id).filter(Boolean)])],
          }}
          actualStatus={existingResponse?.status}
          showDetails={true}
          compact={false}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Text Response - Only show if required or optional (OR) */}
        {(exercise.requireText === 'required' || exercise.requireText === 'or') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {exercise.textPrompt || 'Your Response'} *
              {isCompleted && <span className="ml-2 text-sm text-gray-500 italic">(Read-only)</span>}
            </label>
            <RichTextEditor
              value={response.responseText}
              onChange={isCompleted ? () => {} : (content) => {
                setResponse(prev => ({ ...prev, responseText: content }));
              }}
              placeholder={exercise.textPrompt ? `Enter your response for: ${exercise.textPrompt}` : "Enter your response..."}
              maxLength={exercise.maxTextLength}
              id={`exercise-${exercise.id}-text-response`}
              className={`mb-2 ${isCompleted ? 'pointer-events-none opacity-75' : ''}`}
            />
          </div>
        )}

        {/* Image Upload - Only show if required or optional (OR) */}
        {(exercise.requireImage === 'required' || exercise.requireImage === 'or') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Upload * {exercise.allowMultipleImages && '(Multiple allowed)'}
              {isCompleted && <span className="ml-2 text-sm text-gray-500 italic">(Read-only)</span>}
            </label>
            {!isCompleted && (
              <input
                type="file"
                accept="image/*"
                multiple={exercise.allowMultipleImages}
                onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            
            {/* Show uploaded images */}
            {response.imageS3Keys.length > 0 && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium text-green-700">Uploaded Images:</h4>
                <div className="flex flex-wrap gap-2">
                  {response.imageS3Keys.map((key, index) => (
                    <ImagePreview key={index} s3Key={key} index={index} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Show local files waiting to upload with preview */}
            {response.imageFiles.length > 0 && !isCompleted && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Ready to Upload:</h4>
                <div className="flex flex-wrap gap-2">
                  {response.imageFiles.map((file, index) => {
                    const imageUrl = URL.createObjectURL(file);
                    return (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Selected image ${index + 1}`}
                          className="w-32 h-32 object-cover rounded border border-yellow-200"
                          onLoad={() => URL.revokeObjectURL(imageUrl)}
                        />
                        <button
                          onClick={() => removeFile('image', index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-yellow-600 text-white text-xs p-1 text-center">
                          Pending Upload
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Recording - Only show if required or optional (OR) */}
        {(exercise.requireAudio === 'required' || exercise.requireAudio === 'or') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Recording *
              {isCompleted && <span className="ml-2 text-sm text-gray-500 italic">(Read-only)</span>}
            </label>
            <div className="flex items-center space-x-4">
              {!isCompleted && !isRecording ? (
                <button
                  onClick={startAudioRecording}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <span>🎤</span>
                  <span>Start Recording</span>
                </button>
              ) : !isCompleted && isRecording ? (
                <button
                  onClick={stopAudioRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <span>⏹️</span>
                  <span>Stop Recording ({formatTime(recordingTime)})</span>
                </button>
              ) : null}
              {response.audioFile && !isCompleted && (
                <span className="text-blue-600 text-sm">🎤 Audio recorded (ready to upload)</span>
              )}
              {response.audioS3Key && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-sm">✓ Audio uploaded</span>
                  <AudioPlayerWrapper 
                    s3Key={response.audioS3Key}
                    title="Your Audio Response"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Recording and Upload - Only show if required or optional (OR) */}
        {(exercise.requireVideo === 'required' || exercise.requireVideo === 'or') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Upload *
              {isCompleted && <span className="ml-2 text-sm text-gray-500 italic">(Read-only)</span>}
            </label>
            {!isCompleted ? (
              <VideoRecordUpload
                videos={response.videos}
                onVideosChange={(videos) => setResponse(prev => ({ ...prev, videos }))}
                exerciseId={exercise.id}
                exerciseTitle={exercise.title}
                category="exercise-response"
                responseType="video"
                maxVideos={5}
                maxSizePerVideo={100}
                maxDurationSeconds={300}
              />
            ) : (
              response.videos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-700">Uploaded Videos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {response.videos.map((video, index) => (
                      <div key={index} className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium">{video.name}</p>
                        <p className="text-xs text-gray-500">Video uploaded</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Document Upload - Only show if required or optional (OR) */}
        {(exercise.requireDocument === 'required' || exercise.requireDocument === 'or') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Upload *
              {isCompleted && <span className="ml-2 text-sm text-gray-500 italic">(Read-only)</span>}
            </label>
            <DocumentUpload
              documents={response.documents}
              onDocumentsChange={(documents) => {
                // Deduplicate documents by S3 key
                const uniqueDocuments = documents.filter((doc, index, arr) => 
                  arr.findIndex(d => (d.s3Key || d.id) === (doc.s3Key || doc.id)) === index
                );
                setResponse(prev => ({ ...prev, documents: uniqueDocuments }));
              }}
              exerciseId={exercise.id}
              exerciseTitle={exercise.title}
              category="exercise-response"
              maxDocuments={exercise.allowMultipleDocuments ? 5 : 1}
              maxSizePerDocument={10}
              readOnly={isCompleted}
            />
          </div>
        )}

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Uploading files...</h4>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="mb-2">
                <div className="flex justify-between text-sm text-blue-800">
                  <span>{filename}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          
          <div className="flex space-x-4">
            {(() => {
              const requirements = {
                requireText: exercise.requireText,
                requireImage: exercise.requireImage,
                requireAudio: exercise.requireAudio,
                requireVideo: exercise.requireVideo,
                requireDocument: exercise.requireDocument,
              };
              const currentResponse = {
                textResponse: response.responseText,
                imageUrls: [...response.imageS3Keys, ...response.imageFiles.map(f => f.name)],
                audioUrl: response.audioS3Key || (response.audioFile ? 'pending' : ''),
                videoUrl: response.videoS3Keys[0] || (response.videos.length > 0 ? 'pending' : ''),
                documentUrls: [...new Set([...response.documentS3Keys, ...response.documents.map(d => d.s3Key || d.id).filter(Boolean)])],
              };
              const progress = calculateExerciseProgress(requirements, currentResponse, existingResponse?.status);

              // Debug logging
              console.log('Form Progress Debug:', {
                requirements,
                currentResponse,
                progress,
                canComplete: progress.canComplete,
                missingRequirements: progress.missingRequirements
              });

              // If exercise is actually completed (saved status), show read-only message
              if (existingResponse?.status === 'completed') {
                return (
                  <div className="text-sm text-gray-500 italic">
                    Assignment completed. View only.
                  </div>
                );
              }

              return (
                <>
                  <button
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save as Draft'}
                  </button>
                  
                  <button
                    onClick={handleComplete}
                    disabled={isLoading || !progress.canComplete}
                    className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      progress.canComplete 
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    title={progress.canComplete 
                      ? 'Complete this assignment' 
                      : `Complete all requirements first: ${progress.missingRequirements.join(', ')}`
                    }
                  >
                    {isLoading 
                      ? 'Processing...' 
                      : progress.canComplete
                        ? 'Complete Assignment'
                        : `Complete Assignment (${progress.completedRequirements}/${progress.totalRequirements})`
                    }
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
} 
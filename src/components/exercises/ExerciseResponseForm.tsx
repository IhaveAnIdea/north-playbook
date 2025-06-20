'use client';

import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { calculateExerciseProgress } from '@/utils/exerciseProgress';
import ExerciseProgress from './ExerciseProgress';
import VideoRecordUpload, { VideoData } from '@/components/media/VideoRecordUpload';
import AudioPlayer from '@/components/media/AudioPlayer';
import VideoPlayer from '@/components/media/VideoPlayer';
import DocumentUpload from '@/components/media/DocumentUpload';
import DocumentThumbnail, { DocumentData } from '@/components/media/DocumentThumbnail';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Exercise {
  id: string;
  title: string;
  description: string;
  question: string;
  instructions?: string;
  requireText: boolean;
  requireImage: boolean;
  requireAudio: boolean;
  requireVideo: boolean;
  requireDocument: boolean;
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
  documentS3Keys?: string[];
  createdAt?: string;
}

interface ExerciseResponseFormProps {
  exercise: Exercise;
  existingResponse?: ExerciseResponse;
  onSave?: (response: unknown) => void;
  onComplete?: (response: unknown) => void;
  onCancel?: () => void;
}

export default function ExerciseResponseForm({ 
  exercise, 
  existingResponse, 
  onSave, 
  onComplete, 
  onCancel 
}: ExerciseResponseFormProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  const [response, setResponse] = useState({
    responseText: existingResponse?.responseText || '',
    imageFiles: [] as File[],
    audioFile: null as File | null,
    videoFiles: [] as VideoData[],
    documentFiles: [] as DocumentData[],
    imageS3Keys: existingResponse?.imageS3Keys || [],
    audioS3Key: existingResponse?.audioS3Key || '',
    videoS3Keys: existingResponse?.videoS3Key ? [existingResponse.videoS3Key] : [],
    documentS3Keys: existingResponse?.documentS3Keys || [],
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Validation to check if all required fields are filled
  const validateRequiredFields = () => {
    const errors: string[] = [];

    if (exercise.requireText && !response.responseText.trim()) {
      errors.push('Text response is required');
    }

    if (exercise.requireImage && response.imageFiles.length === 0 && response.imageS3Keys.length === 0) {
      errors.push('At least one image is required');
    }

    if (exercise.requireAudio && !response.audioFile && !response.audioS3Key) {
      errors.push('Audio recording is required');
    }

    if (exercise.requireVideo && response.videoFiles.length === 0 && response.videoS3Keys.length === 0) {
      errors.push('Video recording is required');
    }

    if (exercise.requireDocument && response.documentFiles.length === 0 && response.documentS3Keys.length === 0) {
      errors.push('At least one document is required');
    }

    return errors;
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

  // Video recording functions
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        setResponse(prev => ({ ...prev, videoFile: file }));
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start video recording:', error);
      setError('Failed to start video recording. Please check your camera permissions.');
    }
  };

  const stopVideoRecording = () => {
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

  const handleDocumentFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.includes('pdf') || 
      file.type.includes('doc') || 
      file.type.includes('txt') ||
      file.type.includes('csv')
    );
    if (exercise.allowMultipleDocuments) {
      setResponse(prev => ({ ...prev, documentFiles: [...prev.documentFiles, ...validFiles] }));
    } else {
      setResponse(prev => ({ ...prev, documentFiles: validFiles.slice(0, 1) }));
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Upload files and collect the keys directly
      const uploadedImageKeys: string[] = [];
      const uploadedDocumentKeys: string[] = [];
      let uploadedAudioKey = '';
      let uploadedVideoKey = '';

      // Upload images
      if (response.imageFiles.length > 0) {
        const imageUploadPromises = response.imageFiles.map(async (file) => {
          const key = await uploadFile(file, 'exercise-responses/images');
          uploadedImageKeys.push(key);
          return key;
        });
        await Promise.all(imageUploadPromises);
      }

      // Upload audio
      if (response.audioFile) {
        uploadedAudioKey = await uploadFile(response.audioFile, 'exercise-responses/audio');
      }

      // Upload video
      if (response.videoFile) {
        uploadedVideoKey = await uploadFile(response.videoFile, 'exercise-responses/video');
      }

      // Upload documents
      if (response.documentFiles.length > 0) {
        const documentUploadPromises = response.documentFiles.map(async (file) => {
          const key = await uploadFile(file, 'exercise-responses/documents');
          uploadedDocumentKeys.push(key);
          return key;
        });
        await Promise.all(documentUploadPromises);
      }

      // Combine existing and newly uploaded keys
      const finalImageS3Keys = [...response.imageS3Keys, ...uploadedImageKeys];
      const finalDocumentS3Keys = [...response.documentS3Keys, ...uploadedDocumentKeys];
      const finalAudioS3Key = response.audioS3Key || uploadedAudioKey;
      const finalVideoS3Key = response.videoS3Key || uploadedVideoKey;

      // Update state with the uploaded keys
      setResponse(prev => ({
        ...prev,
        imageS3Keys: finalImageS3Keys,
        documentS3Keys: finalDocumentS3Keys,
        audioS3Key: finalAudioS3Key,
        videoS3Key: finalVideoS3Key,
        imageFiles: [],
        documentFiles: [],
        audioFile: null,
        videoFile: null,
      }));

      // Save response as draft (use the collected keys, not state)
      const responseData = {
        exerciseId: exercise.id,
        userId: user?.userId || '',
        responseText: response.responseText || null,
        imageS3Keys: finalImageS3Keys.length > 0 ? finalImageS3Keys : null,
        audioS3Key: finalAudioS3Key || null,
        videoS3Key: finalVideoS3Key || null,
        documentS3Keys: finalDocumentS3Keys.length > 0 ? finalDocumentS3Keys : null,
        status: 'draft' as const,
        timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
      };

      let savedResponse;
      if (existingResponse?.id) {
        savedResponse = await client.models.ExerciseResponse.update({
          id: existingResponse.id,
          ...responseData,
        });
      } else {
        savedResponse = await client.models.ExerciseResponse.create(responseData);
      }

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
      
      // Validate required fields
      const validationErrors = validateRequiredFields();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      setIsLoading(true);

      // Upload files and collect the keys directly
      const uploadedImageKeys: string[] = [];
      const uploadedDocumentKeys: string[] = [];
      let uploadedAudioKey = '';
      let uploadedVideoKey = '';

      // Upload images
      if (response.imageFiles.length > 0) {
        const imageUploadPromises = response.imageFiles.map(async (file) => {
          const key = await uploadFile(file, 'exercise-responses/images');
          uploadedImageKeys.push(key);
          return key;
        });
        await Promise.all(imageUploadPromises);
      }

      // Upload audio
      if (response.audioFile) {
        uploadedAudioKey = await uploadFile(response.audioFile, 'exercise-responses/audio');
      }

      // Upload video
      if (response.videoFile) {
        uploadedVideoKey = await uploadFile(response.videoFile, 'exercise-responses/video');
      }

      // Upload documents
      if (response.documentFiles.length > 0) {
        const documentUploadPromises = response.documentFiles.map(async (file) => {
          const key = await uploadFile(file, 'exercise-responses/documents');
          uploadedDocumentKeys.push(key);
          return key;
        });
        await Promise.all(documentUploadPromises);
      }

      // Combine existing and newly uploaded keys
      const finalImageS3Keys = [...response.imageS3Keys, ...uploadedImageKeys];
      const finalDocumentS3Keys = [...response.documentS3Keys, ...uploadedDocumentKeys];
      const finalAudioS3Key = response.audioS3Key || uploadedAudioKey;
      const finalVideoS3Key = response.videoS3Key || uploadedVideoKey;

      // Update state with the uploaded keys
      setResponse(prev => ({
        ...prev,
        imageS3Keys: finalImageS3Keys,
        documentS3Keys: finalDocumentS3Keys,
        audioS3Key: finalAudioS3Key,
        videoS3Key: finalVideoS3Key,
        imageFiles: [],
        documentFiles: [],
        audioFile: null,
        videoFile: null,
      }));

      // Save response as completed (use the collected keys, not state)
      const responseData = {
        exerciseId: exercise.id,
        userId: user?.userId || '',
        responseText: response.responseText || null,
        imageS3Keys: finalImageS3Keys.length > 0 ? finalImageS3Keys : null,
        audioS3Key: finalAudioS3Key || null,
        videoS3Key: finalVideoS3Key || null,
        documentS3Keys: finalDocumentS3Keys.length > 0 ? finalDocumentS3Keys : null,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
      };

      let savedResponse;
      if (existingResponse?.id) {
        savedResponse = await client.models.ExerciseResponse.update({
          id: existingResponse.id,
          ...responseData,
        });
      } else {
        savedResponse = await client.models.ExerciseResponse.create(responseData);
      }

      // Create a playbook entry for the completed exercise directly using Amplify
      if (savedResponse?.data) {
        try {
          const playbookEntry = await client.models.PlaybookEntry.create({
            userId: user?.userId || '',
            exerciseResponseId: savedResponse.data.id,
            title: exercise.title,
            content: response.responseText || 'Exercise completed',
            category: exercise.category || 'reflection',
            insights: JSON.stringify([]), // Store as JSON string
            audioS3Keys: finalAudioS3Key ? [finalAudioS3Key] : [],
            videoS3Keys: finalVideoS3Key ? [finalVideoS3Key] : [],
            imageS3Keys: finalImageS3Keys || [],
            documentS3Keys: finalDocumentS3Keys || [],
            mood: undefined,
            tags: [exercise.title.toLowerCase().replace(/\s+/g, '-')],
            isHighlight: false,
            viewCount: 0
          });

          if (playbookEntry.data) {
            console.log('Playbook entry created successfully:', playbookEntry.data.id);
          } else {
            console.warn('Failed to create playbook entry, but exercise was completed successfully');
          }
        } catch (playbookError) {
          console.warn('Error creating playbook entry:', playbookError);
          // Don't fail the exercise completion if playbook creation fails
        }
      }

      onComplete?.(savedResponse);
    } catch (error) {
      console.error('Error completing exercise:', error);
      setError('Failed to complete exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeFile = (type: 'image' | 'document', index: number) => {
    if (type === 'image') {
      setResponse(prev => ({
        ...prev,
        imageFiles: prev.imageFiles.filter((_, i) => i !== index)
      }));
    } else {
      setResponse(prev => ({
        ...prev,
        documentFiles: prev.documentFiles.filter((_, i) => i !== index)
      }));
    }
  };

  // Function to get image URL from S3 key
  const getImageUrl = async (s3Key: string): Promise<string> => {
    try {
      const result = await getUrl({ key: s3Key });
      return result.url.toString();
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '';
    }
  };

  // Component to display uploaded images
  const ImagePreview = ({ s3Key, index }: { s3Key: string; index: number }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
      getImageUrl(s3Key).then(url => {
        setImageUrl(url);
        setIsLoading(false);
      });
    }, [s3Key]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
          <span className="text-sm text-green-800">🔄 Loading image {index + 1}...</span>
          <button
            onClick={() => {
              setResponse(prev => ({
                ...prev,
                imageS3Keys: prev.imageS3Keys.filter((_, i) => i !== index)
              }));
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>
      );
    }

    if (!imageUrl) {
      return (
        <div className="flex items-center justify-between p-2 bg-red-50 rounded">
          <span className="text-sm text-red-800">❌ Failed to load image {index + 1}</span>
          <button
            onClick={() => {
              setResponse(prev => ({
                ...prev,
                imageS3Keys: prev.imageS3Keys.filter((_, i) => i !== index)
              }));
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>
      );
    }

    return (
      <div className="bg-green-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-800">✓ Image {index + 1} uploaded</span>
          <button
            onClick={() => {
              setResponse(prev => ({
                ...prev,
                imageS3Keys: prev.imageS3Keys.filter((_, i) => i !== index)
              }));
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={`Uploaded image ${index + 1}`}
            className="w-full max-w-sm h-auto rounded-md border border-green-200"
            style={{ maxHeight: '200px', objectFit: 'cover' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{exercise.title}</h1>
        <p className="text-gray-600 mt-2">{exercise.description}</p>
        {exercise.instructions && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <p className="text-blue-800">{exercise.instructions}</p>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{exercise.question}</h2>
      </div>

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
            responseText: response.responseText,
            imageS3Keys: [...response.imageS3Keys, ...response.imageFiles.map(f => f.name)], // Include local images
            audioS3Key: response.audioS3Key || (response.audioFile ? 'pending' : ''),
            videoS3Key: response.videoS3Key || (response.videoFile ? 'pending' : ''),
            documentS3Keys: [...response.documentS3Keys, ...response.documentFiles.map(f => f.name)], // Include local documents
            status: existingResponse?.status, // Include the existing status
          }}
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
        {/* Text Response */}
        {exercise.requireText && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {exercise.textPrompt || 'Your Response'} *
            </label>
            <RichTextEditor
              value={response.responseText}
              onChange={(content) => {
                setResponse(prev => ({ ...prev, responseText: content }));
              }}
              placeholder={exercise.textPrompt ? `Enter your response for: ${exercise.textPrompt}` : "Enter your response..."}
              maxLength={exercise.maxTextLength}
              id={`exercise-${exercise.id}-text-response`}
              className="mb-2"
            />
          </div>
        )}

        {/* Image Upload */}
        {exercise.requireImage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Upload * {exercise.allowMultipleImages && '(Multiple allowed)'}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple={exercise.allowMultipleImages}
              onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Show uploaded images */}
            {response.imageS3Keys.length > 0 && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium text-green-700">Uploaded Images:</h4>
                {response.imageS3Keys.map((key, index) => (
                  <ImagePreview key={index} s3Key={key} index={index} />
                ))}
              </div>
            )}
            
            {/* Show local files waiting to upload with preview */}
            {response.imageFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Ready to Upload:</h4>
                {response.imageFiles.map((file, index) => {
                  const imageUrl = URL.createObjectURL(file);
                  return (
                    <div key={index} className="bg-yellow-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800">📤 {file.name} (pending upload)</span>
                        <button
                          onClick={() => removeFile('image', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Selected image ${index + 1}`}
                          className="w-full max-w-sm h-auto rounded-md border border-yellow-200"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                          onLoad={() => URL.revokeObjectURL(imageUrl)} // Clean up blob URL
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Audio Recording */}
        {exercise.requireAudio && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Recording *
            </label>
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startAudioRecording}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <span>🎤</span>
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopAudioRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <span>⏹️</span>
                  <span>Stop Recording ({formatTime(recordingTime)})</span>
                </button>
              )}
              {response.audioFile && (
                <span className="text-blue-600 text-sm">🎤 Audio recorded (ready to upload)</span>
              )}
              {response.audioS3Key && (
                <span className="text-green-600 text-sm">✓ Audio uploaded</span>
              )}
            </div>
          </div>
        )}

        {/* Video Recording and Upload */}
        {exercise.requireVideo && (
          <div>
            <VideoRecordUpload
              videos={response.videoFiles}
              onVideosChange={(videos) => setResponse(prev => ({ ...prev, videoFiles: videos }))}
              exerciseId={exercise.id}
              exerciseTitle={exercise.title}
              category="exercise-response"
              responseType="video"
              maxVideos={5}
              maxSizePerVideo={100}
              maxDurationSeconds={300}
            />
            
            {/* Show existing uploaded videos */}
            {response.videoS3Keys.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">Previously Uploaded Videos:</h4>
                <div className="space-y-2">
                  {response.videoS3Keys.map((s3Key, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded">
                      <VideoPlayer 
                        src={`/api/dev/assets/${s3Key}`}
                        title={`Video ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Upload */}
        {exercise.requireDocument && (
          <div>
            <DocumentUpload
              documents={response.documentFiles}
              onDocumentsChange={(documents) => setResponse(prev => ({ ...prev, documentFiles: documents }))}
              exerciseId={exercise.id}
              exerciseTitle={exercise.title}
              category="exercise-response"
              maxDocuments={exercise.allowMultipleDocuments ? 5 : 1}
              maxSizePerDocument={10}
            />
            
            {/* Show existing uploaded documents */}
            {response.documentS3Keys.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">Previously Uploaded Documents:</h4>
                <div className="space-y-2">
                  {response.documentS3Keys.map((s3Key, index) => (
                    <DocumentThumbnail
                      key={index}
                      document={{
                        id: s3Key,
                        name: `Document ${index + 1}`,
                        url: `/api/dev/assets/${s3Key}`,
                        size: 0,
                        type: 'application/pdf',
                        s3Key: s3Key,
                        metadata: {}
                      }}
                      showDownload={true}
                      showRemove={true}
                      onRemove={() => {
                        setResponse(prev => ({
                          ...prev,
                          documentS3Keys: prev.documentS3Keys.filter((_, i) => i !== index)
                        }));
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
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
                responseText: response.responseText,
                imageS3Keys: [...response.imageS3Keys, ...response.imageFiles.map(f => f.name)], // Include local images
                audioS3Key: response.audioS3Key || (response.audioFile ? 'pending' : ''),
                videoS3Key: response.videoS3Key || (response.videoFile ? 'pending' : ''),
                documentS3Keys: [...response.documentS3Keys, ...response.documentFiles.map(f => f.name)], // Include local documents
                status: existingResponse?.status, // Include the existing status
              };
              const progress = calculateExerciseProgress(requirements, currentResponse);

              // If exercise is completed, show read-only message
              if (progress.state === 'completed') {
                return (
                  <div className="text-sm text-gray-500 italic">
                    Exercise completed. View only.
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
                    title={!progress.canComplete 
                      ? `Complete all required elements first. Missing: ${progress.missingRequirements.join(', ')}` 
                      : 'Complete this exercise'
                    }
                  >
                    {isLoading 
                      ? 'Processing...' 
                      : progress.canComplete
                        ? 'Complete Exercise'
                        : `Complete Exercise (${progress.completedRequirements}/${progress.totalRequirements})`
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
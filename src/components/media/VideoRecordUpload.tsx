'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Stack,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  Videocam,
  Stop,
  Replay,
  Delete,
  Save,
  Close,
} from '@mui/icons-material';
import { storageService } from '@/lib/storage-service';
import VideoPlayerWrapper from './VideoPlayerWrapper';

export interface VideoData {
  id: string;
  name: string;
  url: string;
  caption?: string;
  size?: number;
  type?: string;
  s3Key?: string;
  metadata?: Record<string, unknown>;
  duration?: number;
}

interface VideoRecordUploadProps {
  videos?: VideoData[];
  onVideosChange: (videos: VideoData[]) => void;
  maxVideos?: number;
  maxSizePerVideo?: number;
  maxDurationSeconds?: number;
  acceptedTypes?: string[];
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  responseType?: 'text' | 'audio' | 'video';
  mood?: string;
  tags?: string[];
}

export default function VideoRecordUpload({
  videos = [],
  onVideosChange,
  maxVideos = 5,
  maxSizePerVideo = 50,
  maxDurationSeconds = 300,
  acceptedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
  exerciseId,
  exerciseTitle,
  category,
  responseType,
  mood,
  tags = []
}: VideoRecordUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported.`;
    }
    
    if (file.size > maxSizePerVideo * 1024 * 1024) {
      return `File size must be less than ${maxSizePerVideo}MB`;
    }
    
    if (videos.length >= maxVideos) {
      return `Maximum ${maxVideos} videos allowed`;
    }
    
    return null;
  };

  const uploadFile = async (file: File): Promise<VideoData> => {
    const uploadOptions = {
      exerciseId,
      exerciseTitle,
      category,
      responseType,
      mood,
      tags
    };

    try {
      const result = await storageService.uploadPlaybookAsset(file, uploadOptions);
      
      // Save metadata to database
      try {
        await fetch('/api/media/save-asset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: result.key,
            s3Bucket: 'north-playbook',
            fileName: file.name,
            fileType: 'video',
            fileSize: file.size,
            mimeType: file.type,
            category: category || 'video',
            description: `Video: ${file.name}`,
            exerciseId,
            tags: tags || ['video']
          }),
        });
      } catch (metadataError) {
        console.warn('Failed to save asset metadata:', metadataError);
      }
      
      return {
        id: result.key,
        name: file.name,
        url: result.url, // Use the URL returned by storage service (real file URL)
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
      };
    } catch (error) {
      throw new Error(`Failed to upload ${file.name}: ${error}`);
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);
    
    const fileArray = Array.from(files);
    const newVideos: VideoData[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      try {
        const videoData = await uploadFile(file);
        newVideos.push(videoData);
      } catch (err) {
        setError(`${file.name}: ${err}`);
      }
    }

    if (newVideos.length > 0) {
      onVideosChange([...videos, ...newVideos]);
    }

    setUploading(false);
  }, [videos, onVideosChange]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return newDuration;
        });
      }, 1000);

    } catch {
      setError('Could not access camera and microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const saveRecording = async () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
    
    await handleFileSelect([file]);
    
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setRecordingDuration(0);
    setIsRecordingModalOpen(false);
  };

  const discardRecording = () => {
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setRecordingDuration(0);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  React.useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [recordedChunks, isRecording]);

  const handleRemoveVideo = (videoId: string) => {
    onVideosChange(videos.filter(video => video.id !== videoId));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Card sx={{ p: 3, mb: 2, border: '2px dashed', borderColor: 'grey.300' }}>
        <Stack spacing={2}>
          <Typography variant="h6">Add Video Response</Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Videocam />}
              onClick={() => setIsRecordingModalOpen(true)}
              disabled={uploading || videos.length >= maxVideos}
            >
              Record Video
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              component="label"
              disabled={uploading || videos.length >= maxVideos}
            >
              Upload Video
              <input
                type="file"
                hidden
                multiple
                accept={acceptedTypes.join(',')}
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              />
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Maximum {maxVideos} videos, {maxSizePerVideo}MB each. 
            Recording limit: {formatDuration(maxDurationSeconds)}
          </Typography>
        </Stack>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {videos.length > 0 && (
        <Stack spacing={2}>
          {videos.map((video) => (
            <Card key={video.id} sx={{ overflow: 'hidden' }}>
              <VideoPlayerWrapper 
                src={video.url} 
                s3Key={video.s3Key}
                title={video.name}
              />
              <Box sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2">{video.name}</Typography>
                    {video.size && (
                      <Chip 
                        label={`${(video.size / (1024 * 1024)).toFixed(1)} MB`} 
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  <IconButton
                    onClick={() => handleRemoveVideo(video.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              </Box>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog 
        open={isRecordingModalOpen} 
        onClose={() => !isRecording && setIsRecordingModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Record Video Response
          {!isRecording && (
            <IconButton
              onClick={() => setIsRecordingModalOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ position: 'relative', bgcolor: 'black', borderRadius: 1, overflow: 'hidden', aspectRatio: '16/9' }}>
            {recordedVideoUrl ? (
              <video
                src={recordedVideoUrl}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            
            {isRecording && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'error.main',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'white',
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="body2">
                  REC {formatDuration(recordingDuration)}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          {!recordedVideoUrl ? (
            <Stack direction="row" spacing={2}>
              {!isRecording ? (
                <Button
                  variant="contained"
                  startIcon={<Videocam />}
                  onClick={startRecording}
                  color="error"
                >
                  Start Recording
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Stop />}
                  onClick={stopRecording}
                >
                  Stop Recording
                </Button>
              )}
              
              <Button
                variant="outlined"
                onClick={() => setIsRecordingModalOpen(false)}
                disabled={isRecording}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveRecording}
                disabled={uploading}
              >
                Save Recording
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Replay />}
                onClick={discardRecording}
              >
                Record Again
              </Button>
              
              <Button
                variant="text"
                onClick={() => setIsRecordingModalOpen(false)}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
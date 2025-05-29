'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  Send,
  ArrowBack,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { exercises, categoryIcons, categoryColors } from '@/data/exercises';
import ImageUpload, { ImageData } from '@/components/media/ImageUpload';

export default function ExercisePage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const params = useParams();
  const router = useRouter();
  const [textResponse, setTextResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const exerciseId = params.id as string;
  const exercise = exercises.find(ex => ex.id === exerciseId);

  if (!exercise) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Exercise not found</Alert>
          <Button component={Link} href="/exercises" sx={{ mt: 2 }}>
            Back to Exercises
          </Button>
        </Container>
      </>
    );
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: exercise.promptType === 'video' 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: exercise.promptType === 'video' ? 'video/webm' : 'audio/webm' 
        });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone/camera. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In a real app, you would stop the actual recording here
    // For now, we'll just create a dummy blob
    setRecordedBlob(new Blob(['dummy audio data'], { type: 'audio/wav' }));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please sign in to submit your response');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically save to your backend/database
      // For now, we'll just simulate a submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitted(true);
      
      // You could also redirect to a success page or back to exercises
      setTimeout(() => {
        router.push('/exercises');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    if (exercise.promptType === 'text') {
      return textResponse.trim().length > 0;
    }
    return recordedBlob !== null;
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                Response Submitted!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Thank you for completing the &ldquo;{exercise.title}&rdquo; exercise. 
                Your response has been saved and will be analyzed for insights.
              </Typography>
              <Button variant="contained" component={Link} href="/exercises">
                Continue to Exercises
              </Button>
            </CardContent>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          component={Link}
          href="/exercises"
          sx={{ mb: 3 }}
        >
          Back to Exercises
        </Button>

        {/* Exercise Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: `${categoryColors[exercise.category as keyof typeof categoryColors]}.main`,
                  color: 'white',
                  mr: 3,
                                 }}
               >
                 {React.createElement(categoryIcons[exercise.category as keyof typeof categoryIcons])}
               </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {exercise.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={exercise.category}
                    size="small"
                    color={categoryColors[exercise.category as keyof typeof categoryColors]}
                  />
                  <Chip
                    label={exercise.promptType}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={exercise.estimatedTime}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {exercise.description}
            </Typography>

            <Box sx={{ p: 3, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
              <Typography variant="h6" gutterBottom>
                Exercise Question:
              </Typography>
              <Typography variant="body1">
                {exercise.question}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Response Section */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Your Response
            </Typography>

            {exercise.promptType === 'text' && (
              <TextField
                fullWidth
                multiline
                rows={8}
                placeholder="Share your thoughts here..."
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                sx={{ mb: 3 }}
              />
            )}

            {(exercise.promptType === 'audio' || exercise.promptType === 'video') && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <IconButton
                    color={isRecording ? 'error' : 'primary'}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    size="large"
                    sx={{ 
                      bgcolor: isRecording ? 'error.light' : 'primary.light',
                      '&:hover': {
                        bgcolor: isRecording ? 'error.main' : 'primary.main',
                      }
                    }}
                  >
                    {exercise.promptType === 'video' ? (
                      isRecording ? <VideocamOff /> : <Videocam />
                    ) : (
                      isRecording ? <MicOff /> : <Mic />
                    )}
                  </IconButton>
                  <Typography variant="body1">
                    {isRecording 
                      ? `Recording ${exercise.promptType}... Click to stop`
                      : `Click to start recording your ${exercise.promptType} response`
                    }
                  </Typography>
                </Box>
                
                {recordedBlob && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {exercise.promptType === 'video' ? 'Video' : 'Audio'} recorded successfully! 
                    You can record again to replace it.
                  </Alert>
                )}
              </Box>
            )}

            {/* Image Upload Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add Images (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload images that relate to your response - inspiration photos, diagrams, or visual references.
              </Typography>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={3}
                maxSizePerImage={5}
                exerciseId={exerciseId}
                exerciseTitle={exercise.title}
                category={exercise.category}
                responseType={exercise.promptType}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                component={Link}
                href="/exercises"
              >
                Save for Later
              </Button>
              <Button
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                onClick={handleSubmit}
                disabled={!canSubmit() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
} 
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Stack,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeDown,
  VolumeMute,
  Fullscreen,
  FullscreenExit,
  Download,
} from '@mui/icons-material';

interface VideoPlayerProps {
  src: string;
  title?: string;
  showDownload?: boolean;
  poster?: string;
}

export default function VideoPlayer({ src, title, showDownload = true, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setVideoData = () => {
      setDuration(video.duration);
      setCurrentTime(video.currentTime);
    };

    const setVideoTime = () => setCurrentTime(video.currentTime);

    video.addEventListener('loadeddata', setVideoData);
    video.addEventListener('timeupdate', setVideoTime);

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadeddata', setVideoData);
      video.removeEventListener('timeupdate', setVideoTime);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = Array.isArray(newValue) ? newValue[0] : newValue;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = title || 'video-response.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeMute />;
    if (volume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  if (!mounted) {
    return (
      <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'black',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <IconButton disabled size="large" sx={{ color: 'white' }}>
            <PlayArrow />
          </IconButton>
          <Typography variant="body2" sx={{ color: 'white' }}>
            Loading video player...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          bgcolor: 'black',
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(true)} // Keep controls visible for better UX
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlayPause}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
          preload="metadata"
        />

        {/* Video Controls Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            p: 2,
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          {title && (
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
              {title}
            </Typography>
          )}

          <Stack spacing={1}>
            {/* Progress Bar */}
            <Box sx={{ px: 1 }}>
              <Slider
                value={currentTime}
                max={duration}
                onChange={handleSeek}
                aria-label="Video progress"
                sx={{
                  color: 'white',
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-track': {
                    color: 'primary.main',
                  },
                  '& .MuiSlider-rail': {
                    color: 'rgba(255,255,255,0.3)',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={togglePlayPause}
                  sx={{ color: 'white' }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 120 }}>
                  <IconButton onClick={toggleMute} size="small" sx={{ color: 'white' }}>
                    {getVolumeIcon()}
                  </IconButton>
                  <Slider
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.1}
                    aria-label="Volume"
                    sx={{
                      width: 80,
                      color: 'white',
                      '& .MuiSlider-track': {
                        color: 'primary.main',
                      },
                      '& .MuiSlider-rail': {
                        color: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  />
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1}>
                {showDownload && (
                  <IconButton onClick={handleDownload} size="small" sx={{ color: 'white' }} title="Download video">
                    <Download />
                  </IconButton>
                )}
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }} title="Toggle fullscreen">
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
} 
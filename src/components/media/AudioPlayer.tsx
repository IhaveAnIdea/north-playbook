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
  Download,
} from '@mui/icons-material';

interface AudioPlayerProps {
  src: string;
  title?: string;
  showDownload?: boolean;
}

export default function AudioPlayer({ src, title, showDownload = true }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = Array.isArray(newValue) ? newValue[0] : newValue;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
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
    link.download = title || 'audio-response.mp3';
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
      <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {title || 'Audio Player'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <IconButton disabled size="large">
            <PlayArrow />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Loading audio player...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      
      {title && (
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}

      <Stack spacing={2}>
        {/* Progress Bar */}
        <Box sx={{ px: 1 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleSeek}
            aria-label="Audio progress"
            sx={{
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        {/* Controls */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={togglePlayPause}
              size="large"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 120 }}>
              <IconButton onClick={toggleMute} size="small">
                {getVolumeIcon()}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                aria-label="Volume"
                sx={{ width: 80 }}
              />
            </Stack>
          </Stack>

          {showDownload && (
            <IconButton onClick={handleDownload} size="small" title="Download audio">
              <Download />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
} 
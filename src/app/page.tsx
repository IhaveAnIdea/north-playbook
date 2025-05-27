'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Stack,
} from '@mui/material';
import {
  North as NorthIcon,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function Home() {
  const { user } = useAuthenticator((context) => [context.user]);

  return (
    <>
      <Navbar />
      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 50%, #ff6b35 100%)',
            color: 'white',
            py: { xs: 8, md: 12 },
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NorthIcon sx={{ fontSize: { xs: 48, md: 64 } }} />
                <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2.5rem', md: '4rem' } }}>
                  North Playbook
                </Typography>
              </Box>
              
              <Typography variant="h4" component="h2" sx={{ maxWidth: 800, fontWeight: 300, lineHeight: 1.4 }}>
                Transform your life with AI-powered personal development
              </Typography>
              
              <Typography variant="h6" sx={{ maxWidth: 600, opacity: 0.9, fontWeight: 300 }}>
                Create your personal playbook through guided exercises, AI insights, and beautiful storytelling. 
                Your journey to becoming the best version of yourself starts here.
              </Typography>
              
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 4 }}>
                {user ? (
                  <Button
                    size="large"
                    variant="contained"
                    color="secondary"
                    component={Link}
                    href="/dashboard"
                    sx={{
                      py: 2,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="large"
                      variant="contained"
                      color="secondary"
                      component={Link}
                      href="/auth"
                      sx={{
                        py: 2,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                      }}
                    >
                      Start Your Journey
                    </Button>
                    <Button
                      size="large"
                      variant="outlined"
                      color="inherit"
                      sx={{
                        py: 2,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderColor: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" component="h2" gutterBottom color="primary">
              Powerful Features for Personal Growth
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Everything you need to create a meaningful personal development journey, 
              powered by advanced AI and beautiful design.
            </Typography>
          </Box>
        </Container>

        {/* Footer */}
        <Box
          sx={{
            bgcolor: 'primary.dark',
            color: 'white',
            py: 4,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              © 2024 North. Empowering personal growth through technology.
            </Typography>
          </Container>
        </Box>
      </Box>
    </>
  );
}

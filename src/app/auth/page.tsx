'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { Box, Container, Typography } from '@mui/material';
import { North as NorthIcon } from '@mui/icons-material';

export default function AuthPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 50%, #ff6b35 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <NorthIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h1" color="primary.main" fontWeight={700}>
                North Playbook
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue your personal development journey
            </Typography>
          </Box>

          <Authenticator signUpAttributes={['given_name', 'family_name']} />
        </Box>
      </Container>
    </Box>
  );
} 
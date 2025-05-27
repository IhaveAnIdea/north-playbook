'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Container, Box, Typography } from '@mui/material';
import Navbar from '@/components/layout/Navbar';

const ClientOnlyPlaybook = dynamic(() => import('@/components/playbook/ClientOnlyPlaybook'), {
  ssr: false,
  loading: () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4">Loading your playbook...</Typography>
      </Box>
    </Container>
  ),
});

export default function PlaybookPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Navbar />
      {mounted && <ClientOnlyPlaybook />}
    </>
  );
} 
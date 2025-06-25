'use client';

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Assignment,
  LibraryBooks,
  TrendingUp,
  Psychology,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function Dashboard() {
  const { user } = useAuthenticator((context) => [context.user]);

  const dashboardCards = [
    {
      title: 'Start an Exercise',
      description: 'Begin your personal development journey with guided exercises',
      icon: <Assignment />,
      href: '/exercises',
      color: 'primary.main',
    },
    {
      title: 'View My Playbook',
      description: 'See your beautiful personal development story',
      icon: <LibraryBooks />,
      href: '/playbook',
      color: 'secondary.main',
    },
    {
      title: 'Track Progress',
      description: 'Monitor your growth and insights over time',
      icon: <TrendingUp />,
      href: '/progress',
      color: 'success.main',
    },
    {
      title: 'AI Insights',
      description: 'Get personalized recommendations and analysis',
      icon: <Psychology />,
      href: '/insights',
      color: 'warning.main',
    },
  ];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
              {user?.signInDetails?.loginId?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                Welcome back!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Ready to continue your personal development journey?
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Dashboard Cards */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
            What would you like to do today?
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {dashboardCards.map((card, index) => (
              <Card key={index} sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: card.color,
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Typography variant="h5" component="h3">
                      {card.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                    {card.description}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    component={Link}
                    href={card.href}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
            Your Journey So Far
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h3" component="div" color="primary.main" gutterBottom>
                  0
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Assignments Completed
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h3" component="div" color="secondary.main" gutterBottom>
                  0
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Playbook Entries
                </Typography>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h3" component="div" color="success.main" gutterBottom>
                  0
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Days Active
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </>
  );
} 
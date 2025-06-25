'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  Avatar,
  Alert,
  Chip,
  Divider,
} from '@mui/material';

import {
  AccountCircle,
  Edit,
  Save,
  Cancel,
  Email,
  Person,
  Badge,
  CalendarToday,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Navbar from '@/components/layout/Navbar';
import { samplePlaybookEntries } from '@/data/playbook';

export default function ProfilePage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    joinDate: '',
  });
  const [editedProfile, setEditedProfile] = useState(userProfile);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize user profile from Amplify user data only after mounting
    if (mounted && user) {
      // Use a static date to avoid hydration mismatches
      const joinDate = new Date('2024-01-01').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const profile = {
        displayName: user.signInDetails?.loginId?.split('@')[0] || '',
        firstName: user.signInDetails?.loginId?.split('@')[0] || '',
        lastName: '',
        email: user.signInDetails?.loginId || '',
        bio: '',
        joinDate,
      };
      setUserProfile(profile);
      setEditedProfile(profile);
    }
  }, [mounted, user]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setEditedProfile(userProfile);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Here you would typically save to a backend
    setUserProfile(editedProfile);
    setIsEditing(false);
    console.log('Saving profile:', editedProfile);
  };

  const handleInputChange = (field: keyof typeof editedProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Calculate real stats from playbook data
  const calculateStats = () => {
    const totalEntries = samplePlaybookEntries.length;
    
    // Calculate unique exercises completed (based on unique exercise IDs)
    const uniqueExercises = new Set(samplePlaybookEntries.map(entry => entry.exerciseId));
    const exercisesCompleted = uniqueExercises.size;
    
    // Calculate days active (unique dates when entries were completed)
    const uniqueDates = new Set(
      samplePlaybookEntries.map(entry => 
        entry.completedAt.toDateString()
      )
    );
    const daysActive = uniqueDates.size;
    
    return {
      exercisesCompleted,
      playbookEntries: totalEntries,
      daysActive
    };
  };

  const stats = calculateStats();

  if (!mounted) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h4">Loading profile...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <AccountCircle sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h3" component="h1">
              Profile
            </Typography>
          </Stack>
          <Typography variant="h6" color="text.secondary">
            Manage your personal information and profile settings
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
          {/* Profile Card */}
          <Box>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                  <Typography variant="h5" component="h2">
                    Personal Information
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {isEditing ? (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          size="small"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleEditToggle}
                          size="small"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEditToggle}
                        size="small"
                      >
                        Edit
                      </Button>
                    )}
                  </Stack>
                </Box>

                {/* Profile Avatar and Basic Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 4 }}>
                  <Avatar sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '3rem' }}>
                    {userProfile.displayName?.[0]?.toUpperCase() || userProfile.email?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" gutterBottom>
                      {userProfile.displayName || 'User'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      {userProfile.email}
                    </Typography>
                    {mounted && (
                      <Chip 
                        icon={<CalendarToday />} 
                        label={`Joined ${userProfile.joinDate}`} 
                        variant="outlined" 
                        size="small"
                      />
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Profile Fields */}
                <Stack spacing={3}>
                  <TextField
                    label="Display Name"
                    value={isEditing ? editedProfile.displayName : userProfile.displayName}
                    onChange={handleInputChange('displayName')}
                    fullWidth
                    disabled={!isEditing}
                    helperText="This is how your name will appear throughout the app"
                    InputProps={{
                      startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="First Name"
                      value={isEditing ? editedProfile.firstName : userProfile.firstName}
                      onChange={handleInputChange('firstName')}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                    
                    <TextField
                      label="Last Name"
                      value={isEditing ? editedProfile.lastName : userProfile.lastName}
                      onChange={handleInputChange('lastName')}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Box>
                  
                  <TextField
                    label="Email"
                    value={userProfile.email}
                    disabled
                    fullWidth
                    helperText="Email cannot be changed"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />

                  <TextField
                    label="Bio"
                    value={isEditing ? editedProfile.bio : userProfile.bio}
                    onChange={handleInputChange('bio')}
                    disabled={!isEditing}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Tell us a bit about yourself and your personal development journey..."
                    helperText="Optional: Share your goals, interests, or motivation"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Stats and Activity */}
          <Box>
            <Stack spacing={3}>
              {/* Activity Stats */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Your Journey
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Assignments Completed
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {stats.exercisesCompleted}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Playbook Entries
                      </Typography>
                      <Typography variant="h6" color="secondary.main">
                        {stats.playbookEntries}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Days Active
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {stats.daysActive}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Account Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Account Type
                      </Typography>
                      <Typography variant="body1">
                        Personal Development
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Member Since
                      </Typography>
                      <Typography variant="body1">
                        {mounted ? userProfile.joinDate : 'January 1, 2024'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip label="Active" color="success" size="small" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Stack spacing={2}>
                    <Button variant="outlined" fullWidth href="/exercises">
                      Start New Assignment
                    </Button>
                    <Button variant="outlined" fullWidth href="/playbook">
                      View My Playbook
                    </Button>
                    <Button variant="outlined" fullWidth href="/settings">
                      Account Settings
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Box>

        {/* Privacy Notice */}
        <Box sx={{ mt: 4 }}>
          <Alert severity="info">
            Your profile information is private and secure. Only you can see and edit this information.
          </Alert>
        </Box>
      </Container>
    </>
  );
} 
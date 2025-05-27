'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Switch,
  Stack,
  Button,
  TextField,
  Avatar,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  Palette,
  Language,
  Download,
  Delete,
  AccountCircle,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Navbar from '@/components/layout/Navbar';

export default function SettingsPage() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    autoSave: true,
    language: 'en',
  });
  const [userInfo, setUserInfo] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    setMounted(true);
    // Initialize user info from Amplify user data
    if (user) {
      setUserInfo({
        displayName: user.signInDetails?.loginId?.split('@')[0] || '',
        firstName: user.signInDetails?.loginId?.split('@')[0] || '',
        lastName: '',
        email: user.signInDetails?.loginId || '',
      });
    }
  }, [user]);

  const handleSettingChange = (setting: keyof typeof settings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const handleUserInfoChange = (field: keyof typeof userInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save to a backend or local storage
    console.log('Saving settings:', settings);
    console.log('Saving user info:', userInfo);
  };

  if (!mounted) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h4">Loading settings...</Typography>
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
            <SettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h3" component="h1">
              Settings
            </Typography>
          </Stack>
          <Typography variant="h6" color="text.secondary">
            Manage your account preferences and application settings
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
          {/* Profile Settings */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <AccountCircle sx={{ color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Profile Information
                </Typography>
              </Stack>
              
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                    {userInfo.displayName?.[0]?.toUpperCase() || userInfo.email?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{userInfo.displayName || 'User'}</Typography>
                    <Typography variant="body2" color="text.secondary">{userInfo.email}</Typography>
                  </Box>
                </Box>

                <TextField
                  label="Display Name"
                  value={userInfo.displayName}
                  onChange={handleUserInfoChange('displayName')}
                  fullWidth
                  helperText="This is how your name will appear throughout the app"
                />

                <TextField
                  label="First Name"
                  value={userInfo.firstName}
                  onChange={handleUserInfoChange('firstName')}
                  fullWidth
                />
                
                <TextField
                  label="Last Name"
                  value={userInfo.lastName}
                  onChange={handleUserInfoChange('lastName')}
                  fullWidth
                />
                
                <TextField
                  label="Email"
                  value={userInfo.email}
                  onChange={handleUserInfoChange('email')}
                  fullWidth
                  disabled
                  helperText="Email cannot be changed"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Palette sx={{ color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  App Preferences
                </Typography>
              </Stack>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Push Notifications" 
                    secondary="Receive notifications for new insights and reminders"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications}
                      onChange={handleSettingChange('notifications')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Language />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Updates" 
                    secondary="Receive weekly progress summaries via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.emailUpdates}
                      onChange={handleSettingChange('emailUpdates')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Palette />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Dark Mode" 
                    secondary="Use dark theme for the application"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSettingChange('darkMode')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Download />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auto-save Responses" 
                    secondary="Automatically save exercise responses as you type"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.autoSave}
                      onChange={handleSettingChange('autoSave')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Security sx={{ color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Data & Privacy
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <Alert severity="info">
                  Your data is encrypted and stored securely. We never share your personal information with third parties.
                </Alert>

                <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Export Your Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Download all your exercise responses, insights, and playbook entries.
                  </Typography>
                  <Button variant="outlined" startIcon={<Download />}>
                    Export Data
                  </Button>
                </Paper>

                <Paper sx={{ p: 3, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                  <Typography variant="h6" gutterBottom color="error.main">
                    Delete Account
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Typography>
                  <Button variant="outlined" color="error" startIcon={<Delete />}>
                    Delete Account
                  </Button>
                </Paper>
              </Stack>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Save Changes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Save your profile and preference changes.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleSaveSettings}
                  sx={{ px: 4 }}
                >
                  Save Settings
                </Button>
                <Button variant="outlined" size="large">
                  Reset to Defaults
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
} 
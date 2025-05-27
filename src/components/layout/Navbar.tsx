'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Assignment,
  LibraryBooks,
  Settings,
  Logout,
  North as NorthIcon,
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    router.push('/');
  };

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Exercises', icon: <Assignment />, path: '/exercises' },
    { text: 'My Playbook', icon: <LibraryBooks />, path: '/playbook' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)', color: 'white' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NorthIcon />
          North Playbook
        </Typography>
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} component={Link} href={item.path} onClick={() => setMobileDrawerOpen(false)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider />
        <ListItem onClick={handleSignOut}>
          <ListItemIcon><Logout /></ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          {isMobile && user && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <NorthIcon sx={{ fontSize: 32 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              North Playbook
            </Typography>
          </Box>

          {!isMobile && user && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={Link}
                  href={item.path}
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {user ? (
            <Box sx={{ ml: 2 }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user.signInDetails?.loginId?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose} component={Link} href="/profile">
                  <AccountCircle sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleClose} component={Link} href="/settings">
                  <Settings sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSignOut}>
                  <Logout sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button 
              color="inherit" 
              component={Link} 
              href="/auth"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
} 
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a237e', // Deep blue for North
      light: '#3f51b5',
      dark: '#0d1446',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6b35', // Vibrant orange for motivation
      light: '#ff9569',
      dark: '#c13515',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '12px 24px',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
          boxShadow: '0 3px 5px 2px rgba(26, 35, 126, .3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #0d1446 30%, #1a237e 90%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #ff6b35 30%, #ff9569 90%)',
          boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #c13515 30%, #ff6b35 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
          boxShadow: '0 2px 10px rgba(26, 35, 126, 0.2)',
        },
      },
    },
  },
}); 
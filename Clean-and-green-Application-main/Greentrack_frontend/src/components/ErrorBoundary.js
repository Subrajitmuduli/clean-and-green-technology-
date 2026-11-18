import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * Global Error Boundary — catches any unhandled React error and shows
 * a friendly recovery screen instead of a blank white page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛑 ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#0f1a12',
            color: '#fff',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: '4rem', mb: 2 }}>🌿</Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', mb: 1, color: '#4caf50' }}
          >
            Oops! Something went wrong
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              mb: 4,
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            Don't worry — your data is safe. This was a temporary glitch.
            Please try again or go back to the home page.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={this.handleRetry}
              sx={{
                fontWeight: 'bold',
                borderRadius: '12px',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                boxShadow: '0 4px 20px rgba(76,175,80,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #66bb6a, #388e3c)',
                },
              }}
            >
              🔄 Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleReset}
              sx={{
                fontWeight: 'bold',
                borderRadius: '12px',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                color: '#4caf50',
                borderColor: 'rgba(76,175,80,0.4)',
                '&:hover': {
                  borderColor: '#4caf50',
                  bgcolor: 'rgba(76,175,80,0.08)',
                },
              }}
            >
              🏠 Go Home
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

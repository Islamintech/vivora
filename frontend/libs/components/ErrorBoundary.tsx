import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          Something went wrong
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          {this.state.error.message || 'An unexpected error occurred.'}
        </Typography>
        <Button variant="contained" onClick={this.reset}>
          Try again
        </Button>
      </Box>
    );
  }
}

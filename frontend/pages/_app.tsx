import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import { theme } from '../libs/theme';
import { getApolloClient } from '../apollo/client';
import { useAuthStore } from '../apollo/store';
import { ErrorBoundary } from '../libs/components/ErrorBoundary';

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const client = getApolloClient();

  return (
    <>
      <Head>
        {/* Fonts live in _document (stylesheets don't belong in next/head). */}
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>Vivora</title>
      </Head>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <AuthHydrator>
              <Component {...pageProps} />
            </AuthHydrator>
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '10px',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 500,
              },
            }}
          />
        </ThemeProvider>
      </ApolloProvider>
    </>
  );
}

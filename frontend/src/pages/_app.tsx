import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import { theme } from '@/theme';
import { getApolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth.store';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <title>RestoPlatform</title>
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

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { AuthProvider, ThemeProvider, LanguageProvider } from '@/contexts';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA support
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="ArianDoc - سامانه مدیریت اسناد دیجیتال هلدینگ آرین سعید" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>ArianDoc | آرین‌داک</title>
      </Head>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}

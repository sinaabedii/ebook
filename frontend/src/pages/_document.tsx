/**
 * Next.js Document Component
 * Custom document for HTML structure and font loading
 */

import { Html, Head, Main, NextScript } from 'next/document';

// =============================================================================
// Document Component
// =============================================================================

export default function Document() {
  return (
    <Html lang="fa" dir="rtl">
      <Head>
        {/* Font Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Font Loading */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

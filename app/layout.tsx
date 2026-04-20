import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// ── Roboto Font ──────────────────────────────────────────────
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

// ── Site-wide Metadata ───────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL('https://alphastocksinsight.com'), // ← change to your domain
  title: {
    default: 'Alpha Stocks Insight | US Stock News & Investment Ideas',
    template: '%s | Alpha Stocks Insight',
  },
  description:
    'AI-powered US stock news, independent investment ideas, and market analysis covering NASDAQ and NYSE stocks with daily insights and in-depth research.',
  keywords: [
    'stock news',
    'investment ideas',
    'US stocks',
    'NASDAQ',
    'NYSE',
    'stock analysis',
    'market intelligence',
    'NVDA',
    'AAPL',
    'TSLA',
    'AI stocks',
  ],
  authors: [{ name: 'Alpha Stocks Insight' }],
  creator: 'Alpha Stocks Insight',
  publisher: 'Alpha Stocks Insight',
  openGraph: {
    type: 'website',
    siteName: 'Alpha Stocks Insight',
    title: 'Alpha Stocks Insight | US Stock News & Investment Ideas',
    description:
      'AI-powered independent analysis on the US stocks that matter most to investors.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Stocks Insight',
    description: 'AI-powered US stock news and independent investment ideas.',
    creator: '@alphastocksinsight', // ← update with your handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'YOUR_GOOGLE_SITE_VERIFICATION_TOKEN', // ← add after Google Search Console setup
  },
}

// ── Root Layout ──────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          ════════════════════════════════════════════════════════
          GOOGLE ADSENSE SCRIPT
          Uncomment and replace with your real Publisher ID once
          your AdSense account is approved:

          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
          ════════════════════════════════════════════════════════
        */}
      </head>
      <body className={`${roboto.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

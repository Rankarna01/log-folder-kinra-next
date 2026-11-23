import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Nunito_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { PwaRegister } from '@/components/pwa/PwaRegister';

export const metadata: Metadata = {
  title: 'Timesheet KINRA Sei Mangkei — Logbook Harian Peserta Magang',
  description: 'Aplikasi pencatatan logbook kegiatan harian peserta magang KINRA Sei Mangkei',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/images/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/images/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' }],
  },
};

const fontSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#008187',
  width: 'device-width',
  initialScale: 1,
  };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const saved = (await cookies()).get('kinra_tema')?.value;
  const theme = saved === 'dark' || saved === 'light' ? saved : undefined;

  return (
    <html
      lang="id"
      className={`h-full ${fontSans.variable} ${fontMono.variable}`}
      data-theme={theme}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen text-[#111827] antialiased bg-[#F0F4F3]">
        <FeedbackProvider>
          <ConfirmProvider>
            <PwaRegister />
            <AppShell>{children}</AppShell>
          </ConfirmProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}

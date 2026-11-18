import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Timesheet KINRA Sei Mangkei — Logbook Harian Peserta Magang',
  description: 'Aplikasi pencatatan logbook kegiatan harian peserta magang KINRA Sei Mangkei',
  manifest: '/manifest.json',
  icons: {
    icon: '/kinra.png',
    apple: '/kinra.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B6E6C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen text-[#111827] antialiased bg-[#F0F4F3]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

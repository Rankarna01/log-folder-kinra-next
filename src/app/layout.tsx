import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Timesheet KINRA Sei Mangkei — Logbook Harian Peserta',
  description: 'Aplikasi pencatatan logbook kegiatan harian peserta magang KINRA Sei Mangkei',
  icons: {
    icon: '/kinra.png',
  },
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
      </head>
      <body className="min-h-screen text-[#111827] antialiased">
        <main className="max-w-[440px] mx-auto min-h-screen bg-[#F4F7F6] relative shadow-2xl flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

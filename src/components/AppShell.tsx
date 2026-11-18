'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar, TopBar, FloatingDock } from '@/components/Navigation';
import type { Profile, UserRole } from '@/types/database';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasTodayLog, setHasTodayLog] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/onboarding');

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (prof) {
          setProfile(prof);
        } else {
          // Fallback profile if record not found yet
          setProfile({
            id: user.id,
            email: user.email || '',
            name: user.email?.split('@')[0] || 'Peserta Magang',
            role: 'participant',
            division: 'Divisi Teknologi Informasi',
            position: 'Peserta Magang KINRA',
            mentor_id: null,
            mentor_name: 'RIZKY DELIANNGI',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Check today's log
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: log } = await supabase
          .from('logbooks')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();

        setHasTodayLog(!!log);
      } catch (err) {
        console.error('Failed to load user in AppShell:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [pathname, isAuthPage, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // On Auth pages, render centered clean container
  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-[#F4F7F6] flex flex-col justify-center items-center p-4">
        {children}
      </main>
    );
  }

  const role: UserRole = profile?.role || 'participant';
  const name = profile?.name || 'Peserta Magang';
  const division = profile?.division || 'Divisi Teknologi Informasi';

  return (
    <div className="min-h-screen bg-[#F0F4F3] flex flex-col md:flex-row antialiased text-[#111827]">
      {/* Desktop Sidebar (Laptop / PC) */}
      <Sidebar
        userName={name}
        userDivision={division}
        userRole={role}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile TopBar */}
        <TopBar
          userName={name}
          userDivision={division}
          userRole={role}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 lg:p-10 pb-28 md:pb-10 flex flex-col">
          {children}
        </main>

        {/* Mobile Bottom Bar (FloatingDock) */}
        <FloatingDock hasTodayLog={hasTodayLog} userRole={role} />
      </div>
    </div>
  );
}

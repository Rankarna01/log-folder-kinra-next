'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Logbook, Profile } from '@/types/database';

/** Buka kalender dengan modal logbook untuk hari ini. */
function calendarToday() {
  const t = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `/logbook?date=${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}&open=1`;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayLog, setTodayLog] = useState<Logbook | null>(null);
  const [recentLogs, setRecentLogs] = useState<Logbook[]>([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Live Digital Clock
  useEffect(() => {
    const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss} WIB`);

      const dayName = daysId[now.getDay()];
      const d = String(now.getDate()).padStart(2, '0');
      const m = monthsId[now.getMonth()];
      const y = now.getFullYear();
      setCurrentDateStr(`${dayName}, ${d} ${m} ${y}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Supabase data
  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) setProfile(prof);

      // Today's date YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      // Check today's logbook
      const { data: todayEntry } = await supabase
        .from('logbooks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (todayEntry) setTodayLog(todayEntry);

      // Recent 3 days logs
      const { data: recents, count } = await supabase
        .from('logbooks')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(3);

      if (recents) setRecentLogs(recents);
      if (count !== null) setTotalLogsCount(count);
    }

    loadData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="space-y-4">
        {/* Participant Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#0B6E6C] text-white flex items-center justify-center shrink-0 shadow-xs border-2 border-white">
              <i className="fa-solid fa-graduation-cap text-lg"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[#111827] truncate">
                {profile?.name || 'Muhammad Randy Karna'}
              </h1>
              <p className="text-[11px] text-zinc-500 truncate">
                {profile?.division || 'Divisi Teknologi Informasi'} • {profile?.position || 'Junior Full stack developer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white rounded-full px-2.5 py-1.5 shadow-xs flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo/kinra-logo.png" alt="KINRA" className="h-5 w-auto object-contain" />
            </div>
          </div>
        </header>

        {/* Hero KINRA Solid Primary Card */}
        <section className="bg-[#008187] rounded-[28px] p-5 relative overflow-hidden shadow-xs text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] sm:text-lg font-bold !text-white leading-snug">
                Pencatatan Logbook Kegiatan Harian
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 font-medium truncate">
                Mentor: {profile?.mentor_name || 'RIZKY DELIANNGI'}
              </p>
            </div>

            <div className="shrink-0">
              {!todayLog ? (
                <Link
                  href={calendarToday()}
                  className="bg-white hover:bg-[#FDE9B4] text-[#0B6E6C] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition shrink-0 inline-flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  <span>Catat Hari Ini</span>
                </Link>
              ) : (
                <Link
                  href={calendarToday()}
                  className="bg-[#FDE9B4] hover:bg-white text-[#18181B] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition shrink-0 inline-flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                  <span>Edit Hari Ini</span>
                </Link>
              )}
            </div>
          </div>

          {/* Dark Charcoal Inner Live Clock Card */}
          <div className="mt-5 bg-[#18181B] rounded-[22px] px-5 py-4 flex items-center justify-between relative shadow-inner">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FDE9B4]">
                  Waktu Saat Ini
                </span>
              </div>
              <div className="text-xl font-extrabold tracking-tight text-white mt-1">
                {currentTime || '08:00:00 WIB'}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                {currentDateStr} • {totalLogsCount} hari tercatat
              </div>
            </div>

            <div className="w-14 h-14 rounded-[18px] bg-[#F7A61C] text-[#18181B] flex items-center justify-center shadow-md shrink-0">
              <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
            </div>
          </div>
        </section>

        {/* Quick Action Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <Link
            href="/logbook"
            className="shrink-0 bg-[#C8EBE5] hover:bg-[#B3E2DA] text-[#074745] text-xs font-semibold px-3.5 py-2 rounded-full shadow-xs flex items-center gap-1.5 transition"
          >
            <i className="fa-regular fa-calendar-days"></i>
            <span>Kalender Logbook</span>
          </Link>

          <Link
            href="/reports"
            className="shrink-0 bg-[#FDE9B4] hover:bg-[#FBD97F] text-[#78350F] text-xs font-semibold px-3.5 py-2 rounded-full shadow-xs flex items-center gap-1.5 transition"
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>Cetak PDF</span>
          </Link>
        </div>

        {/* Section: Catatan Logbook 3 Hari Terakhir */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#111827]">
              Catatan Logbook (3 Hari Terakhir)
            </h2>
            <Link
              href="/logbook"
              className="text-xs font-bold text-[#0B6E6C] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="bg-white rounded-[26px] p-6 text-center space-y-3 shadow-xs">
              <p className="text-xs text-zinc-500 font-medium">Belum ada logbook harian tercatat.</p>
              <Link
                href={calendarToday()}
                className="inline-flex items-center gap-1.5 bg-[#0B6E6C] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xs"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>Tambah Logbook Harian</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-[24px] p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827]">{log.date}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        log.work_location === 'lapangan'
                          ? 'bg-[#FDE9B4] text-[#78350F]'
                          : 'bg-[#C8EBE5] text-[#074745]'
                      }`}
                    >
                      {log.work_location === 'lapangan' ? 'Lapangan' : 'Kantor'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">{log.title}</h3>
                    <p className="text-xs text-zinc-600 line-clamp-2 mt-1">{log.final_description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-xs">
                    <span className="text-zinc-400 font-medium">
                      {log.start_time.slice(0, 5)} - {log.end_time.slice(0, 5)}
                    </span>
                    <Link
                      href={`/logbook/${log.id}`}
                      className="text-[#0B6E6C] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Detail</span>
                      <i className="fa-solid fa-chevron-right text-[9px]"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

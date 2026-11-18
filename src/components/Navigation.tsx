'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopBar({
  userName = 'Muhammad Randy Karna',
  userDivision = 'Divisi Teknologi Informasi',
  onLogout,
}: {
  userName?: string;
  userDivision?: string;
  onLogout?: () => void;
}) {
  return (
    <div className="w-full pt-2 px-3">
      <div className="bg-[#18181B] text-white rounded-full px-3 py-1.5 flex items-center justify-between text-[11px] shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-white rounded-full px-2 py-0.5 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kinra.png" alt="KINRA" className="h-3.5 w-auto object-contain" />
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="font-semibold tracking-tight truncate">
            {userName} • {userDivision}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onLogout ? (
            <button
              onClick={onLogout}
              className="px-3 py-0.5 rounded-full bg-[#0B6E6C] text-white border border-emerald-400/30 font-bold hover:bg-[#0D8280] transition flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
              <span>Keluar</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-0.5 rounded-full bg-[#0B6E6C] text-white border border-emerald-400/30 font-bold hover:bg-[#0D8280] transition flex items-center gap-1"
            >
              <i className="fa-solid fa-right-to-bracket text-[10px]"></i>
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function FloatingDock({ hasTodayLog = false }: { hasTodayLog?: boolean }) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard' || pathname === '/';
  const isCalendar = pathname.startsWith('/logbook') && pathname !== '/logbook/create';
  const isReports = pathname.startsWith('/reports');
  const isProfile = pathname.startsWith('/profile');

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[420px] w-[calc(100%-2rem)]">
      <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-2 shadow-xl border border-zinc-200/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-[20px] transition ${
              isHome ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-solid fa-house text-base"></i>
          </Link>

          <Link
            href="/logbook"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-[20px] transition ${
              isCalendar ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-regular fa-calendar-days text-base"></i>
          </Link>

          <Link
            href="/reports"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-[20px] transition ${
              isReports ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-solid fa-file-pdf text-base"></i>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-[20px] transition ${
              isProfile ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-regular fa-user text-base"></i>
          </Link>
        </div>

        {/* Floating Action Button (Create Logbook) */}
        <Link
          href="/logbook/create"
          aria-label={hasTodayLog ? 'Edit Logbook Hari Ini' : 'Tambah Logbook'}
          className="w-12 h-12 rounded-[20px] bg-[#18181B] text-white hover:bg-[#0B6E6C] transition flex items-center justify-center shadow-md shrink-0 ml-1"
        >
          {hasTodayLog ? (
            <i className="fa-solid fa-pen-to-square text-sm text-[#FDE9B4]"></i>
          ) : (
            <i className="fa-solid fa-plus text-base"></i>
          )}
        </Link>
      </div>
    </nav>
  );
}

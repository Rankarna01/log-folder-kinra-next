'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/database';

export function Sidebar({
  userName = 'Muhammad Randy Karna',
  userDivision = 'Divisi Teknologi Informasi',
  userRole = 'participant',
  onLogout,
}: {
  userName?: string;
  userDivision?: string;
  userRole?: UserRole;
  onLogout?: () => void;
}) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard' || pathname === '/';
  const isCalendar = pathname.startsWith('/logbook') && pathname !== '/logbook/create';
  const isCreate = pathname === '/logbook/create';
  const isReports = pathname.startsWith('/reports');
  const isProfile = pathname.startsWith('/profile');

  const isMentorReview = pathname === '/mentor';
  const isMentorInterns = pathname === '/mentor/interns';

  const isAdminDashboard = pathname === '/admin';
  const isAdminInterns = pathname === '/admin/interns';
  const isAdminMentors = pathname === '/admin/mentors';
  const isAdminSettings = pathname === '/admin/settings';

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string }> = {
    admin: { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-700' },
    mentor: { label: 'Mentor Pembimbing', bg: 'bg-amber-100', text: 'text-amber-800' },
    participant: { label: 'Peserta Magang', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  };

  const currentRoleInfo = roleLabels[userRole] || roleLabels.participant;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-zinc-200/80 min-h-screen sticky top-0 h-screen p-5 justify-between shrink-0 shadow-xs z-30">
      <div className="space-y-6 overflow-y-auto no-scrollbar">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-zinc-200/80 p-1.5 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kinra.png" alt="KINRA" className="h-7 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-[#111827] tracking-tight leading-tight">
              Timesheet KINRA
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium truncate">
              KEK Sei Mangkei
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-[#F4F7F6] rounded-2xl p-3 border border-zinc-200/60 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0B6E6C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#111827] truncate">{userName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{userDivision}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${currentRoleInfo.bg} ${currentRoleInfo.text}`}
            >
              <i className="fa-solid fa-shield text-[8px] mr-1"></i>
              {currentRoleInfo.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Aktif
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-5">
          {/* Menu Utama (Peserta) */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
              Menu Utama
            </p>

            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isHome
                  ? 'bg-[#0B6E6C] text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#0B6E6C]'
              }`}
            >
              <i className="fa-solid fa-house text-sm w-4 text-center"></i>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/logbook"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isCalendar
                  ? 'bg-[#0B6E6C] text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#0B6E6C]'
              }`}
            >
              <i className="fa-regular fa-calendar-days text-sm w-4 text-center"></i>
              <span>Kalender Logbook</span>
            </Link>

            <Link
              href="/logbook/create"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isCreate
                  ? 'bg-[#0B6E6C] text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#0B6E6C]'
              }`}
            >
              <i className="fa-solid fa-plus-circle text-sm w-4 text-center"></i>
              <span>Tambah Logbook</span>
            </Link>

            <Link
              href="/reports"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isReports
                  ? 'bg-[#0B6E6C] text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#0B6E6C]'
              }`}
            >
              <i className="fa-solid fa-file-pdf text-sm w-4 text-center"></i>
              <span>Rekap & Laporan PDF</span>
            </Link>
          </div>

          {/* Portal Mentor (Hanya untuk Mentor & Super Admin) */}
          {(userRole === 'mentor' || userRole === 'admin') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-1.5">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Portal Mentor
                </p>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                  Mentor
                </span>
              </div>

              <Link
                href="/mentor"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isMentorReview
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-amber-50 hover:text-amber-800'
                }`}
              >
                <i className="fa-solid fa-clipboard-check text-sm w-4 text-center"></i>
                <span>Review Logbook</span>
              </Link>

              <Link
                href="/mentor/interns"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isMentorInterns
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-amber-50 hover:text-amber-800'
                }`}
              >
                <i className="fa-solid fa-users text-sm w-4 text-center"></i>
                <span>Anak Magang Bimbingan</span>
              </Link>
            </div>
          )}

          {/* Portal Super Admin (Hanya untuk Super Admin) */}
          {userRole === 'admin' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-1.5">
                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                  Super Admin
                </p>
                <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                  Admin
                </span>
              </div>

              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminDashboard
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-purple-50 hover:text-purple-800'
                }`}
              >
                <i className="fa-solid fa-chart-pie text-sm w-4 text-center"></i>
                <span>Ringkasan Admin</span>
              </Link>

              <Link
                href="/admin/interns"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminInterns
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-purple-50 hover:text-purple-800'
                }`}
              >
                <i className="fa-solid fa-user-graduate text-sm w-4 text-center"></i>
                <span>Data Anak Magang</span>
              </Link>

              <Link
                href="/admin/mentors"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminMentors
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-purple-50 hover:text-purple-800'
                }`}
              >
                <i className="fa-solid fa-chalkboard-user text-sm w-4 text-center"></i>
                <span>Data Mentor</span>
              </Link>

              <Link
                href="/admin/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminSettings
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-purple-50 hover:text-purple-800'
                }`}
              >
                <i className="fa-solid fa-sliders text-sm w-4 text-center"></i>
                <span>Pengaturan Sistem</span>
              </Link>
            </div>
          )}

          {/* Akun */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
              Akun
            </p>

            <Link
              href="/profile"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isProfile
                  ? 'bg-[#0B6E6C] text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#0B6E6C]'
              }`}
            >
              <i className="fa-regular fa-user text-sm w-4 text-center"></i>
              <span>Profil Pengguna</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="pt-4 border-t border-zinc-200/80 space-y-2">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center"></i>
            <span>Keluar Akun</span>
          </button>
        )}
        <div className="px-3 pt-1 text-[10px] text-zinc-400 flex items-center justify-between">
          <span>v1.2.0 • PWA</span>
          <span>PT KINRA © 2026</span>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({
  userName = 'Muhammad Randy Karna',
  userDivision = 'Divisi Teknologi Informasi',
  userRole = 'participant',
  onLogout,
}: {
  userName?: string;
  userDivision?: string;
  userRole?: UserRole;
  onLogout?: () => void;
}) {
  const roleBadges: Record<UserRole, { label: string; bg: string; text: string }> = {
    admin: { label: 'Admin', bg: 'bg-purple-500/20', text: 'text-purple-300' },
    mentor: { label: 'Mentor', bg: 'bg-amber-500/20', text: 'text-amber-300' },
    participant: { label: 'Peserta', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  };

  const badge = roleBadges[userRole] || roleBadges.participant;

  return (
    <div className="w-full pt-2 px-3 md:hidden">
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
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {onLogout ? (
            <button
              onClick={onLogout}
              className="px-2.5 py-0.5 rounded-full bg-[#0B6E6C] text-white border border-emerald-400/30 font-bold hover:bg-[#0D8280] transition flex items-center gap-1 cursor-pointer text-[10px]"
            >
              <i className="fa-solid fa-right-from-bracket text-[9px]"></i>
              <span>Keluar</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-0.5 rounded-full bg-[#0B6E6C] text-white border border-emerald-400/30 font-bold hover:bg-[#0D8280] transition flex items-center gap-1 text-[10px]"
            >
              <i className="fa-solid fa-right-to-bracket text-[9px]"></i>
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function FloatingDock({
  hasTodayLog = false,
  userRole = 'participant',
}: {
  hasTodayLog?: boolean;
  userRole?: UserRole;
}) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard' || pathname === '/';
  const isCalendar = pathname.startsWith('/logbook') && pathname !== '/logbook/create';
  const isReports = pathname.startsWith('/reports');
  const isProfile = pathname.startsWith('/profile');
  const isMentor = pathname.startsWith('/mentor');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[420px] w-[calc(100%-2rem)] md:hidden">
      <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-2 shadow-xl border border-zinc-200/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 justify-around">
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
              isHome ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-solid fa-house text-sm"></i>
          </Link>

          <Link
            href="/logbook"
            aria-label="Kalender Logbook"
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
              isCalendar ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-regular fa-calendar-days text-sm"></i>
          </Link>

          {/* Quick link to Mentor portal if mentor */}
          {userRole === 'mentor' && (
            <Link
              href="/mentor"
              aria-label="Review Mentor"
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                isMentor ? 'bg-amber-600 text-white shadow-xs' : 'text-zinc-500 hover:text-amber-700'
              }`}
            >
              <i className="fa-solid fa-clipboard-check text-sm"></i>
            </Link>
          )}

          {/* Quick link to Admin portal if admin */}
          {userRole === 'admin' && (
            <Link
              href="/admin"
              aria-label="Admin Portal"
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                isAdmin ? 'bg-purple-700 text-white shadow-xs' : 'text-zinc-500 hover:text-purple-700'
              }`}
            >
              <i className="fa-solid fa-chart-pie text-sm"></i>
            </Link>
          )}

          <Link
            href="/reports"
            aria-label="Laporan PDF"
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
              isReports ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-solid fa-file-pdf text-sm"></i>
          </Link>

          <Link
            href="/profile"
            aria-label="Profil Pengguna"
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
              isProfile ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-regular fa-user text-sm"></i>
          </Link>
        </div>

        {/* Floating Action Button (Create Logbook) */}
        <Link
          href="/logbook/create"
          aria-label={hasTodayLog ? 'Edit Logbook Hari Ini' : 'Tambah Logbook'}
          className="w-11 h-11 rounded-[18px] bg-[#18181B] text-white hover:bg-[#0B6E6C] transition flex items-center justify-center shadow-md shrink-0 ml-1"
        >
          {hasTodayLog ? (
            <i className="fa-solid fa-pen-to-square text-xs text-[#FDE9B4]"></i>
          ) : (
            <i className="fa-solid fa-plus text-sm"></i>
          )}
        </Link>
      </div>
    </nav>
  );
}

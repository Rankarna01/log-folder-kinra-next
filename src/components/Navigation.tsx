'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/database';
import { useSidebarCollapsed, setSidebarCollapsed } from '@/lib/sidebar';

export function Sidebar({
  userRole = 'participant',
  onLogout,
}: {
  userRole?: UserRole;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const toggleCollapsed = () => setSidebarCollapsed(!collapsed);

  const isHome = pathname === '/dashboard' || pathname === '/';
  const isCalendar = pathname.startsWith('/logbook');
  const isReports = pathname.startsWith('/reports');
  const isProfile = pathname.startsWith('/profile');

  const isMentorDashboard = pathname === '/mentor';
  const isMentorReview = pathname === '/mentor/review';
  const isMentorInterns = pathname === '/mentor/interns';

  const isAdminDashboard = pathname === '/admin';
  const isAdminInterns = pathname === '/admin/interns';
  const isAdminMentors = pathname === '/admin/mentors';
  const isAdminSettings = pathname === '/admin/settings';

  return (
    <aside
      className="kc-sidebar hidden md:flex flex-col bg-[#008187] border-r border-white/10 sticky top-0 h-screen shrink-0 z-30"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {/* Blok brand Hijau Tosca (Panduan UI/UX: logo 168px di pojok kiri atas) */}
      <div className="kc-brand bg-[#008187] px-6 py-5 shrink-0 flex items-center justify-between gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo/kinra-logo-tosca.png" alt="KINRA Sei Mangkei" width={168} height={66} className="kc-brand-logo w-[168px] h-auto" />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="kc-sidebar-toggle"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
          title={collapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
        >
          <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} aria-hidden="true"></i>
        </button>
      </div>

      <div className="flex-1 min-h-0 space-y-6 overflow-y-auto no-scrollbar p-5">

        {/* Navigation Groups */}
        <div className="space-y-5">
          {/* Menu Utama (hanya Peserta) */}
          {userRole === 'participant' && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider px-3 mb-1.5">
              Menu Utama
            </p>

            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isHome
                  ? 'bg-white text-[#008187] shadow-xs'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-house text-sm w-4 text-center"></i>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/logbook"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isCalendar
                  ? 'bg-white text-[#008187] shadow-xs'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              }`}
            >
              <i className="fa-regular fa-calendar-days text-sm w-4 text-center"></i>
              <span>Kalender Logbook</span>
            </Link>

            <Link
              href="/reports"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isReports
                  ? 'bg-white text-[#008187] shadow-xs'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-file-pdf text-sm w-4 text-center"></i>
              <span>Rekap & Laporan PDF</span>
            </Link>
          </div>
          )}

          {/* Portal Mentor (hanya Mentor) */}
          {userRole === 'mentor' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-1.5">
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                  Portal Mentor
                </p>
                <span className="text-[9px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded">
                  Mentor
                </span>
              </div>

              <Link
                href="/mentor"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isMentorDashboard
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-chart-line text-sm w-4 text-center"></i>
                <span>Dashboard</span>
              </Link>

              <Link
                href="/mentor/review"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isMentorReview
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-clipboard-check text-sm w-4 text-center"></i>
                <span>Review Logbook</span>
              </Link>

              <Link
                href="/mentor/interns"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isMentorInterns
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
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
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                  Super Admin
                </p>
                <span className="text-[9px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded">
                  Admin
                </span>
              </div>

              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminDashboard
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-chart-pie text-sm w-4 text-center"></i>
                <span>Ringkasan Admin</span>
              </Link>

              <Link
                href="/admin/interns"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminInterns
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-user-graduate text-sm w-4 text-center"></i>
                <span>Data Anak Magang</span>
              </Link>

              <Link
                href="/admin/mentors"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminMentors
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-chalkboard-user text-sm w-4 text-center"></i>
                <span>Data Mentor</span>
              </Link>

              <Link
                href="/admin/divisions"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/admin/divisions'
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-sitemap text-sm w-4 text-center"></i>
                <span>Master Divisi</span>
              </Link>

              <Link
                href="/admin/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isAdminSettings
                    ? 'bg-white text-[#008187] shadow-xs'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-sliders text-sm w-4 text-center"></i>
                <span>Pengaturan Sistem</span>
              </Link>
            </div>
          )}

          {/* Akun */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider px-3 mb-1.5">
              Akun
            </p>

            <Link
              href="/profile"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isProfile
                  ? 'bg-white text-[#008187] shadow-xs'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              }`}
            >
              <i className="fa-regular fa-user text-sm w-4 text-center"></i>
              <span>Profil Pengguna</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-5 pt-4 border-t border-white/20 space-y-2 shrink-0">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-white/15 transition cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center"></i>
            <span>Keluar Akun</span>
          </button>
        )}
        <div className="px-3 pt-1 text-[10px] text-white/60 flex items-center justify-between">
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
            <img src="/images/logo/kinra-logo.png" alt="KINRA" className="h-4 w-auto object-contain" />
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
  userRole = 'participant',
}: {
  userRole?: UserRole;
}) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard' || pathname === '/';
  const isCalendar = pathname.startsWith('/logbook');
  const isReports = pathname.startsWith('/reports');
  const isProfile = pathname.startsWith('/profile');
  const isMentor = pathname === '/mentor';
  const isAdmin = pathname === '/admin';

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[420px] w-[calc(100%-2rem)] md:hidden">
      <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-2 shadow-xl border border-zinc-200/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 justify-around">
          {userRole === 'participant' && (<>
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
          </>)}

          {/* Quick link to Mentor portal if mentor */}
          {userRole === 'mentor' && (
            <Link
              href="/mentor"
              aria-label="Dashboard Mentor"
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                isMentor ? 'bg-amber-600 text-white shadow-xs' : 'text-zinc-500 hover:text-amber-700'
              }`}
            >
              <i className="fa-solid fa-chart-line text-sm"></i>
            </Link>
          )}
          {userRole === 'mentor' && (
            <Link
              href="/mentor/review"
              aria-label="Review Logbook"
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                pathname === '/mentor/review' ? 'bg-amber-600 text-white shadow-xs' : 'text-zinc-500 hover:text-amber-700'
              }`}
            >
              <i className="fa-solid fa-clipboard-check text-sm"></i>
            </Link>
          )}
          {userRole === 'mentor' && (
            <Link
              href="/mentor/interns"
              aria-label="Anak Magang Bimbingan"
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                pathname === '/mentor/interns' ? 'bg-amber-600 text-white shadow-xs' : 'text-zinc-500 hover:text-amber-700'
              }`}
            >
              <i className="fa-solid fa-users text-sm"></i>
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
          {userRole === 'admin' && (
            <>
              <Link
                href="/admin/interns"
                aria-label="Data Anak Magang"
                className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                  pathname === '/admin/interns' ? 'bg-purple-700 text-white shadow-xs' : 'text-zinc-500 hover:text-purple-700'
                }`}
              >
                <i className="fa-solid fa-user-graduate text-sm"></i>
              </Link>
              <Link
                href="/admin/mentors"
                aria-label="Data Mentor"
                className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
                  pathname === '/admin/mentors' ? 'bg-purple-700 text-white shadow-xs' : 'text-zinc-500 hover:text-purple-700'
                }`}
              >
                <i className="fa-solid fa-chalkboard-user text-sm"></i>
              </Link>
            </>
          )}

          {userRole === 'participant' && (
          <Link
            href="/reports"
            aria-label="Laporan PDF"
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-[18px] transition ${
              isReports ? 'bg-[#0B6E6C] text-white shadow-xs' : 'text-zinc-500 hover:text-[#0B6E6C]'
            }`}
          >
            <i className="fa-solid fa-file-pdf text-sm"></i>
          </Link>
          )}

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

      </div>
    </nav>
  );
}

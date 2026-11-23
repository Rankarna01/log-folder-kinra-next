'use client';

import { useState, useEffect, useRef } from 'react';
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
  userName = 'Randy',
  userDivision = 'Divisi Teknologi Informasi',
  userRole = 'participant',
  userNik,
  avatarUrl,
  onLogout,
}: {
  userName?: string;
  userDivision?: string;
  userRole?: UserRole;
  userNik?: string | null;
  avatarUrl?: string | null;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!collapsed);
  };

  // Pemetaan label breadcrumb dinamis sesuai halaman & role
  const roleLabelMap: Record<UserRole, { badge: string; desc: string }> = {
    participant: { badge: 'PENGGUNA', desc: 'Pengguna' },
    mentor: { badge: 'MENTOR', desc: 'Mentor' },
    admin: { badge: 'SUPER ADMIN', desc: 'Super Admin' },
  };
  const roleInfo = roleLabelMap[userRole] || roleLabelMap.participant;

  let section = 'DASHBOARD SDM';
  let title = 'Dashboard SDM';

  if (pathname === '/dashboard' || pathname === '/') {
    section = 'DASHBOARD SDM';
    title = 'Dashboard SDM';
  } else if (pathname.startsWith('/logbook/create')) {
    section = 'LOGBOOK SDM';
    title = 'Buat Logbook Baru';
  } else if (pathname.startsWith('/logbook')) {
    section = 'LOGBOOK SDM';
    title = 'Kalender Logbook';
  } else if (pathname.startsWith('/reports')) {
    section = 'LAPORAN SDM';
    title = 'Rekap & Laporan PDF';
  } else if (pathname === '/mentor/review') {
    section = 'PORTAL MENTOR';
    title = 'Verifikasi Logbook';
  } else if (pathname === '/mentor/interns') {
    section = 'PORTAL MENTOR';
    title = 'Data Anak Magang Bimbingan';
  } else if (pathname.startsWith('/mentor')) {
    section = 'PORTAL MENTOR';
    title = 'Dashboard Mentor';
  } else if (pathname === '/admin/interns') {
    section = 'SUPER ADMIN';
    title = 'Data Anak Magang';
  } else if (pathname === '/admin/mentors') {
    section = 'SUPER ADMIN';
    title = 'Data Mentor';
  } else if (pathname === '/admin/divisions') {
    section = 'SUPER ADMIN';
    title = 'Master Divisi';
  } else if (pathname === '/admin/settings') {
    section = 'SUPER ADMIN';
    title = 'Pengaturan Sistem';
  } else if (pathname.startsWith('/admin')) {
    section = 'SUPER ADMIN';
    title = 'Ringkasan Admin';
  } else if (pathname.startsWith('/profile')) {
    section = 'AKUN PENGGUNA';
    title = 'Profil Pengguna';
  }

  const shortName = userName.trim().split(' ')[0] || userName;
  const initial = (shortName || 'U').charAt(0).toUpperCase();
  const nikDisplay = userNik ? `NIK ${userNik}` : (userRole === 'admin' ? 'ID 0001' : userDivision);

  return (
    <header className="kc-topbar sticky top-0 z-20 w-full h-14 md:h-16 px-3 sm:px-5 md:px-6 flex items-center justify-between border-b transition-colors select-none">
      {/* Sisi Kiri: Tombol Hamburger + Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="kc-topbar-btn cursor-pointer shrink-0"
          aria-label={collapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
          title={collapsed ? 'Perlebar sidebar' : 'Ciutkan sidebar'}
        >
          <i className="fa-solid fa-bars text-sm" aria-hidden="true"></i>
        </button>

        {/* Breadcrumb info */}
        <div className="flex items-center gap-2 min-w-0 text-xs">
          <span className="kc-topbar-eyebrow text-[10px] md:text-[11px] shrink-0">
            {section}
          </span>
          <span className="font-light text-xs opacity-40">/</span>
          <span className="kc-topbar-title text-xs md:text-sm truncate">
            {title} · Peran: {roleInfo.desc}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Notifikasi & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
        {/* Tombol OneSeiMangkei SEZ di-hide sesuai instruksi pengguna */}
        {/* <a href="https://onesimangkei.id" target="_blank" rel="noreferrer" className="hidden ...">OneSeiMangkei SEZ ↗</a> */}

        {/* Notifikasi Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="kc-topbar-btn cursor-pointer relative"
            aria-label="Pemberitahuan"
            title="Pemberitahuan"
          >
            <i className="fa-regular fa-bell text-sm" aria-hidden="true"></i>
          </button>

          {notifOpen && (
            <div className="kc-dropdown absolute right-0 mt-2 w-72 rounded-2xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="font-bold text-xs" style={{ color: 'var(--ink)' }}>Pemberitahuan</span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>Semua terbaca</span>
              </div>
              <div className="py-5 text-center text-[11.5px]" style={{ color: 'var(--muted)' }}>
                <i className="fa-regular fa-bell-slash text-xl mb-1.5 block opacity-40"></i>
                Tidak ada pemberitahuan baru
              </div>
            </div>
          )}
        </div>

        {/* Divider Vertikal */}
        <div className="h-6 w-px bg-[var(--line-2)] mx-0.5 hidden sm:block" aria-hidden="true" />

        {/* Profile Card & Avatar */}
        <div className="relative" ref={profileMenuRef}>
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 pl-1.5 py-1 rounded-full hover:bg-[var(--surface-3)] transition cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-expanded={profileMenuOpen}
            aria-label="Menu akun pengguna"
          >
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="kc-topbar-user-name text-xs">{userName}</span>
                <span className="kc-topbar-badge px-2 py-0.5 rounded-full">
                  {roleInfo.badge}
                </span>
              </div>
              <span className="kc-topbar-user-meta mt-0.5">
                {nikDisplay}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-[var(--tosca)] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/20 overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="kc-dropdown absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="kc-dropdown-head">
                <p className="kc-dropdown-name truncate">{userName}</p>
                <p className="kc-dropdown-meta truncate">{nikDisplay}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="kc-dropdown-item"
                >
                  <i className="fa-regular fa-user text-xs w-4 text-center"></i>
                  <span>Profil Pengguna</span>
                </Link>
              </div>

              {onLogout && (
                <div className="pt-1 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="kc-dropdown-item danger w-full text-left cursor-pointer"
                  >
                    <i className="fa-solid fa-right-from-bracket text-xs w-4 text-center"></i>
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function FloatingDock({
  userRole = 'participant',
}: {
  userRole?: UserRole;
}) {
  const pathname = usePathname();

  type NavItem = {
    href: string;
    label: string;
    icon: string;
    activeIcon?: string;
    isActive: boolean;
  };

  let items: NavItem[] = [];

  if (userRole === 'participant') {
    const isHome = pathname === '/dashboard' || pathname === '/';
    const isCalendar = pathname.startsWith('/logbook');
    const isReports = pathname.startsWith('/reports');
    const isProfile = pathname.startsWith('/profile');

    items = [
      { href: '/dashboard', label: 'Home', icon: 'fa-solid fa-house', isActive: isHome },
      { href: '/logbook', label: 'Logbook', icon: 'fa-regular fa-calendar-days', activeIcon: 'fa-solid fa-calendar-days', isActive: isCalendar },
      { href: '/reports', label: 'Laporan', icon: 'fa-solid fa-file-pdf', isActive: isReports },
      { href: '/profile', label: 'Profil', icon: 'fa-regular fa-user', activeIcon: 'fa-solid fa-user', isActive: isProfile },
    ];
  } else if (userRole === 'mentor') {
    const isMentor = pathname === '/mentor';
    const isReview = pathname === '/mentor/review';
    const isInterns = pathname === '/mentor/interns';
    const isProfile = pathname.startsWith('/profile');

    items = [
      { href: '/mentor', label: 'Home', icon: 'fa-solid fa-chart-line', isActive: isMentor },
      { href: '/mentor/review', label: 'Review', icon: 'fa-solid fa-clipboard-check', isActive: isReview },
      { href: '/mentor/interns', label: 'Magang', icon: 'fa-solid fa-users', isActive: isInterns },
      { href: '/profile', label: 'Profil', icon: 'fa-regular fa-user', activeIcon: 'fa-solid fa-user', isActive: isProfile },
    ];
  } else if (userRole === 'admin') {
    const isAdmin = pathname === '/admin';
    const isInterns = pathname === '/admin/interns';
    const isMentors = pathname === '/admin/mentors';
    const isDivisions = pathname === '/admin/divisions';
    const isProfile = pathname.startsWith('/profile');

    items = [
      { href: '/admin', label: 'Admin', icon: 'fa-solid fa-chart-pie', isActive: isAdmin },
      { href: '/admin/interns', label: 'Magang', icon: 'fa-solid fa-user-graduate', isActive: isInterns },
      { href: '/admin/mentors', label: 'Mentor', icon: 'fa-solid fa-chalkboard-user', isActive: isMentors },
      { href: '/admin/divisions', label: 'Divisi', icon: 'fa-solid fa-sitemap', isActive: isDivisions },
      { href: '/profile', label: 'Profil', icon: 'fa-regular fa-user', activeIcon: 'fa-solid fa-user', isActive: isProfile },
    ];
  }

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[420px] w-[calc(100%-2rem)] md:hidden">
      <div className="bg-[#181920]/95 backdrop-blur-xl rounded-full p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between gap-1">
        {items.map((item) => {
          const iconClass = item.isActive && item.activeIcon ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex items-center justify-center gap-2 h-11 transition-all duration-300 ease-out select-none ${
                item.isActive
                  ? 'bg-white text-zinc-900 rounded-full px-4 shadow-md font-bold'
                  : 'text-white/60 hover:text-white px-3 rounded-full hover:bg-white/10 active:scale-95'
              }`}
            >
              <i className={`${iconClass} ${item.isActive ? 'text-zinc-900 text-sm' : 'text-base'}`} aria-hidden="true"></i>
              {item.isActive && (
                <span className="text-xs font-bold tracking-tight whitespace-nowrap animate-in fade-in duration-200">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

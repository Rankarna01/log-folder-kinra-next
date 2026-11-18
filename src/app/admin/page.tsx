'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Mentor, Logbook } from '@/types/database';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [logbooks, setLogbooks] = useState<Logbook[]>([]);
  const [activeTab, setActiveTab] = useState<'interns' | 'mentors' | 'logbooks' | 'settings'>('interns');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');

  // Form add mentor
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorDivision, setNewMentorDivision] = useState('Divisi Teknologi Informasi');
  const [newMentorPosition, setNewMentorPosition] = useState('');
  const [newMentorEmail, setNewMentorEmail] = useState('');
  const [newMentorPhone, setNewMentorPhone] = useState('');
  const [isSavingMentor, setIsSavingMentor] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check current user profile & role
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setCurrentProfile(prof);

      // Fetch all profiles (interns and others)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allProfiles) {
        setInterns(allProfiles.filter((p) => p.role !== 'admin'));
      }

      // Fetch mentors
      const { data: allMentors } = await supabase
        .from('mentors')
        .select('*')
        .order('name');

      if (allMentors && allMentors.length > 0) {
        setMentors(allMentors);
      } else {
        // Fallback default mentors
        setMentors([
          {
            id: 'm-1',
            name: 'RIZKY DELIANNGI',
            division: 'Divisi Teknologi Informasi',
            position: 'Kepala Unit TI & Sistem Digital',
            email: 'rizky.delianngi@kinra.co.id',
            phone: '08126001234',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'm-2',
            name: 'Ir. HENDRA SAPUTRA',
            division: 'Divisi Operasional & Kawasan',
            position: 'Manajer Operasional Kawasan KEK',
            email: 'hendra.s@kinra.co.id',
            phone: '08126005678',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'm-3',
            name: 'SITI RAHMAWATI, S.E., M.Ak',
            division: 'Divisi Keuangan & Akuntansi',
            position: 'Supervisor Keuangan & Pajak',
            email: 'siti.rahmawati@kinra.co.id',
            phone: '08137009876',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'm-4',
            name: 'DEDI IRAWAN, S.H.',
            division: 'Divisi Umum, SDM & Hukum',
            position: 'Staf Senior SDM & Legal',
            email: 'dedi.irawan@kinra.co.id',
            phone: '08216503412',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'm-5',
            name: 'Ir. AGUS WIJAYA',
            division: 'Divisi Teknik & Pemeliharaan',
            position: 'Kepala Divisi Pemeliharaan Aset',
            email: 'agus.wijaya@kinra.co.id',
            phone: '08116307890',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Fetch all logbooks
      const { data: allLogbooks } = await supabase
        .from('logbooks')
        .select('*, profiles:user_id(name, division, mentor_name)')
        .order('date', { ascending: false })
        .limit(50);

      if (allLogbooks) {
        setLogbooks(allLogbooks);
      }

      setLoading(false);
    }

    loadAdminData();
  }, [router, supabase]);

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorName.trim()) return;
    setIsSavingMentor(true);

    const newMentor = {
      name: newMentorName.trim(),
      division: newMentorDivision,
      position: newMentorPosition.trim() || 'Pembimbing Lapangan',
      email: newMentorEmail.trim() || null,
      phone: newMentorPhone.trim() || null,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('mentors')
      .insert(newMentor)
      .select()
      .maybeSingle();

    if (!error && data) {
      setMentors((prev) => [data, ...prev]);
    } else {
      // Local fallback
      setMentors((prev) => [
        {
          id: `m-${Date.now()}`,
          ...newMentor,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    setIsSavingMentor(false);
    setShowAddMentorModal(false);
    setNewMentorName('');
    setNewMentorPosition('');
    setNewMentorEmail('');
    setNewMentorPhone('');
  };

  const handleMakeAdmin = async (userId: string) => {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    setInterns((prev) =>
      prev.map((i) => (i.id === userId ? { ...i, role: 'admin' } : i))
    );
  };

  const filteredInterns = interns.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.mentor_name && i.mentor_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDivision =
      selectedDivision === 'all' || i.division === selectedDivision;
    return matchSearch && matchDivision;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0B6E6C] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 font-medium">Memuat Data Super Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#18181B] via-[#0B6E6C] to-[#075250] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <i className="fa-solid fa-crown text-[9px]"></i>
              Portal Super Admin
            </span>
            <span className="text-zinc-300 text-xs">• KINRA Sei Mangkei</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Dashboard Manajemen & Monitoring
          </h1>
          <p className="text-xs md:text-sm text-emerald-100 max-w-2xl">
            Kelola data peserta magang, daftar mentor pembimbing, rekap logbook kegiatan, dan hak akses sistem.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peserta Magang</span>
            <i className="fa-solid fa-user-graduate text-emerald-600"></i>
          </div>
          <p className="text-2xl font-black text-[#111827]">{interns.length}</p>
          <p className="text-[10px] text-zinc-500">Terdaftar aktif</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Data Mentor</span>
            <i className="fa-solid fa-chalkboard-user text-amber-600"></i>
          </div>
          <p className="text-2xl font-black text-[#111827]">{mentors.length}</p>
          <p className="text-[10px] text-zinc-500">Mentor pembimbing KINRA</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Logbook</span>
            <i className="fa-solid fa-book text-[#0B6E6C]"></i>
          </div>
          <p className="text-2xl font-black text-[#111827]">{logbooks.length}</p>
          <p className="text-[10px] text-zinc-500">Tercatat di sistem</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Perlu Review</span>
            <i className="fa-solid fa-clock text-rose-500"></i>
          </div>
          <p className="text-2xl font-black text-rose-600">
            {logbooks.filter((l) => l.status === 'submitted').length}
          </p>
          <p className="text-[10px] text-zinc-500">Menunggu verifikasi</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('interns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'interns'
              ? 'bg-[#0B6E6C] text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-user-graduate text-xs"></i>
          <span>Data Anak Magang ({interns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'mentors'
              ? 'bg-[#0B6E6C] text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-chalkboard-user text-xs"></i>
          <span>Data Mentor ({mentors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logbooks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'logbooks'
              ? 'bg-[#0B6E6C] text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-list-check text-xs"></i>
          <span>Semua Logbook ({logbooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#0B6E6C] text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-sliders text-xs"></i>
          <span>Pengaturan Sistem</span>
        </button>
      </div>

      {/* Tab 1: Data Anak Magang */}
      {activeTab === 'interns' && (
        <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Daftar Peserta Magang</h2>
              <p className="text-xs text-zinc-500">Semua anak magang yang terdaftar di Timesheet KINRA</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari nama, email, mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F4F7F6] border-0 rounded-xl px-3 py-2 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C] w-48 sm:w-60"
              />

              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="bg-[#F4F7F6] border-0 rounded-xl px-3 py-2 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              >
                <option value="all">Semua Divisi</option>
                <option value="Divisi Teknologi Informasi">Teknologi Informasi</option>
                <option value="Divisi Operasional & Kawasan">Operasional</option>
                <option value="Divisi Keuangan & Akuntansi">Keuangan</option>
                <option value="Divisi Umum, SDM & Hukum">SDM & Hukum</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Nama Peserta</th>
                  <th className="py-3 px-3">Divisi & Posisi</th>
                  <th className="py-3 px-3">Mentor Pembimbing</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredInterns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Tidak ada data peserta magang yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredInterns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#111827]">{intern.name}</div>
                        <div className="text-[11px] text-zinc-400">{intern.email}</div>
                        {intern.nim_nik && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                            NIM/NIK: {intern.nim_nik}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#111827]">
                          {intern.division || 'Belum diisi'}
                        </div>
                        <div className="text-[11px] text-zinc-500">{intern.position}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          {intern.mentor_name || 'Belum memilih'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            intern.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : intern.role === 'mentor'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {intern.role || 'participant'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {intern.role !== 'admin' && (
                          <button
                            onClick={() => handleMakeAdmin(intern.id)}
                            title="Jadikan Super Admin"
                            className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            + Jadikan Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Data Mentor */}
      {activeTab === 'mentors' && (
        <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Data Mentor Pembimbing</h2>
              <p className="text-xs text-zinc-500">
                Mentor yang terdaftar dan dapat dipilih oleh peserta magang KINRA
              </p>
            </div>

            <button
              onClick={() => setShowAddMentorModal(true)}
              className="bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Tambah Mentor Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => {
              const internCount = interns.filter(
                (i) => i.mentor_name?.toLowerCase() === m.name.toLowerCase()
              ).length;

              return (
                <div
                  key={m.id}
                  className="bg-[#F8FAF9] rounded-2xl p-4 border border-zinc-200/70 space-y-3 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                      <i className="fa-solid fa-chalkboard-user"></i>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {internCount} Anak Magang
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#111827]">{m.name}</h3>
                    <p className="text-[11px] text-[#0B6E6C] font-medium">{m.division}</p>
                    <p className="text-[10px] text-zinc-500">{m.position}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 text-[10px] text-zinc-500 space-y-1">
                    {m.email && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-regular fa-envelope text-zinc-400"></i>
                        <span className="truncate">{m.email}</span>
                      </div>
                    )}
                    {m.phone && (
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-phone text-zinc-400"></i>
                        <span>{m.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Semua Logbook */}
      {activeTab === 'logbooks' && (
        <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Rekapitulasi Semua Logbook</h2>
            <p className="text-xs text-zinc-500">
              Riwayat pengisian logbook harian oleh seluruh peserta magang
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Peserta</th>
                  <th className="py-3 px-3">Judul Kegiatan</th>
                  <th className="py-3 px-3">Durasi</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {logbooks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      Belum ada logbook yang tercatat.
                    </td>
                  </tr>
                ) : (
                  logbooks.map((log) => {
                    const statusConfig = {
                      approved: { label: 'Disetujui', bg: 'bg-emerald-50 text-emerald-800' },
                      submitted: { label: 'Menunggu', bg: 'bg-amber-50 text-amber-800' },
                      rejected: { label: 'Perlu Revisi', bg: 'bg-rose-50 text-rose-800' },
                      draft: { label: 'Draft', bg: 'bg-zinc-100 text-zinc-700' },
                    }[log.status] || { label: log.status, bg: 'bg-zinc-100 text-zinc-700' };

                    return (
                      <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3 px-3 font-medium text-zinc-600 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#111827]">
                          {log.profiles?.name || 'Peserta'}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate font-medium text-zinc-800">
                          {log.title}
                        </td>
                        <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">
                          {log.duration_minutes} Menit
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Pengaturan Sistem */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Konfigurasi Sistem KINRA</h2>
            <p className="text-xs text-zinc-500">
              Parameter global untuk pembatasan logbook dan penggunaan AI
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#111827]">Nama Instansi / Badan Usaha</label>
              <input
                type="text"
                disabled
                value="PT Kawasan Industri Nusantara (KINRA Sei Mangkei)"
                className="mt-1 w-full rounded-xl bg-zinc-100 px-3.5 py-2.5 text-zinc-600 border-0"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#111827]">Maksimal Hari Backdate</label>
                <input
                  type="number"
                  defaultValue={7}
                  className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3.5 py-2.5 text-[#111827] border-0"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">Batas toleransi pengisian logbook mundur</p>
              </div>

              <div>
                <label className="block font-semibold text-[#111827]">Kuota Harian AI Gemini</label>
                <input
                  type="number"
                  defaultValue={30}
                  className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3.5 py-2.5 text-[#111827] border-0"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">Panggilan AI per user per hari</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="bg-[#0B6E6C] text-white font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-[#085856] transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Mentor */}
      {showAddMentorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-[#111827]">Tambah Mentor Pembimbing</h3>
              <button
                onClick={() => setShowAddMentorModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer text-sm"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddMentor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#111827]">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RIZKY DELIANNGI, S.Kom"
                  value={newMentorName}
                  onChange={(e) => setNewMentorName(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3 py-2 border-0 focus:ring-2 focus:ring-[#0B6E6C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111827]">Divisi</label>
                <select
                  value={newMentorDivision}
                  onChange={(e) => setNewMentorDivision(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3 py-2 border-0 focus:ring-2 focus:ring-[#0B6E6C]"
                >
                  <option value="Divisi Teknologi Informasi">Divisi Teknologi Informasi</option>
                  <option value="Divisi Operasional & Kawasan">Divisi Operasional & Kawasan</option>
                  <option value="Divisi Keuangan & Akuntansi">Divisi Keuangan & Akuntansi</option>
                  <option value="Divisi Umum, SDM & Hukum">Divisi Umum, SDM & Hukum</option>
                  <option value="Divisi Teknik & Pemeliharaan">Divisi Teknik & Pemeliharaan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#111827]">Jabatan / Posisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Manajer Operasional"
                  value={newMentorPosition}
                  onChange={(e) => setNewMentorPosition(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3 py-2 border-0 focus:ring-2 focus:ring-[#0B6E6C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#111827]">Email</label>
                  <input
                    type="email"
                    placeholder="nama@kinra.co.id"
                    value={newMentorEmail}
                    onChange={(e) => setNewMentorEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3 py-2 border-0 focus:ring-2 focus:ring-[#0B6E6C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111827]">No. WhatsApp / HP</label>
                  <input
                    type="tel"
                    placeholder="0812..."
                    value={newMentorPhone}
                    onChange={(e) => setNewMentorPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-[#F4F7F6] px-3 py-2 border-0 focus:ring-2 focus:ring-[#0B6E6C]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMentorModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-semibold hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMentor}
                  className="bg-[#0B6E6C] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#085856] shadow-xs"
                >
                  {isSavingMentor ? 'Menyimpan...' : 'Simpan Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

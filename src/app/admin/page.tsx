'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdminCharts } from '@/components/AdminCharts';
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
        setInterns(allProfiles.filter((p) => p.role === 'participant'));
      }

      // Fetch mentors
      const { data: allMentors } = await supabase
        .from('mentors')
        .select('*')
        .order('name');

      setMentors((allMentors as Mentor[]) || []);

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

      {/* Dashboard grafik (data nyata dari Supabase) */}
      <AdminCharts />
    </div>
  );
}

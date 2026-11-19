'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Logbook } from '@/types/database';

export default function LogbookCalendarPage() {
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [monthLogs, setMonthLogs] = useState<Logbook[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-31`;

      const { data } = await supabase
        .from('logbooks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstDay)
        .lte('date', lastDay);

      if (data) setMonthLogs(data as Logbook[]);
      setLoading(false);
    }

    loadLogs();
  }, [year, month, supabase]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Shift to start from Monday (0: Monday, 6: Sunday)
  const offset = (firstDayOfWeek + 6) % 7;
  const calendarCells = [];

  for (let i = 0; i < offset; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateStr,
      isFilled: monthLogs.some((l) => l.date === dateStr),
      isSelected: selectedDate === dateStr,
    });
  }

  const selectedDayLog = monthLogs.find((l) => l.date === selectedDate);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="space-y-4">
        {/* Month Navigator Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0B6E6C] shadow-2xs hover:scale-105 transition cursor-pointer"
          >
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>

          <div className="text-center">
            <h1 className="text-[17px] font-semibold text-[#111827]">
              Kalender Logbook • {monthNames[month]} {year}
            </h1>
          </div>

          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0B6E6C] shadow-2xs hover:scale-105 transition cursor-pointer"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </header>

        {/* Calendar Grid Card */}
        <section className="bg-white rounded-[28px] p-4 shadow-2xs">
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((label) => (
              <span key={label} className="text-[10px] font-semibold text-zinc-400 uppercase">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="aspect-square rounded-[13px] bg-transparent"></div>;
              }

              let cellStyle = 'bg-transparent text-[#111827] font-semibold hover:bg-zinc-100';
              if (cell.isSelected) {
                cellStyle = 'bg-[#0B6E6C] text-white font-bold shadow-xs';
              } else if (cell.isFilled) {
                cellStyle = 'bg-[#FDE9B4] text-[#111827] font-semibold';
              }

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`aspect-square rounded-[13px] flex items-center justify-center text-xs transition cursor-pointer ${cellStyle}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </section>

        {/* Catatan Kegiatan Harian pada Tanggal Terpilih */}
        <section className="bg-white rounded-[28px] p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">Catatan Kegiatan Harian</h2>
            <span className="text-xs font-medium text-[#0B6E6C] flex items-center gap-1">
              <i className="fa-regular fa-calendar"></i>
              <span>{selectedDate}</span>
            </span>
          </div>

          {selectedDayLog ? (
            <div className="bg-[#F4F7F6] rounded-[20px] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-[#0B6E6C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111827] truncate">{selectedDayLog.title}</p>
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <i className="fa-regular fa-clock text-[#0B6E6C]"></i>
                      <span>
                        {selectedDayLog.start_time.slice(0, 5)} - {selectedDayLog.end_time.slice(0, 5)}
                      </span>
                      <span>•</span>
                      <span>{selectedDayLog.work_location === 'lapangan' ? 'Lapangan' : 'Kantor'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-700 leading-relaxed">{selectedDayLog.final_description}</p>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/logbook/${selectedDayLog.id}/edit`}
                  className="flex-1 bg-[#0B6E6C] text-white text-xs font-semibold py-2 rounded-full text-center flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#085856] transition"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span>Edit</span>
                </Link>
                <Link
                  href={`/logbook/${selectedDayLog.id}`}
                  className="flex-1 bg-white border border-zinc-200 text-[#111827] text-xs font-semibold py-2 rounded-full text-center flex items-center justify-center gap-1.5 shadow-2xs hover:bg-zinc-50 transition"
                >
                  <i className="fa-solid fa-eye"></i>
                  <span>Detail</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Belum ada catatan pada tanggal ini.</p>
              <Link
                href={`/logbook/create?date=${selectedDate}`}
                className="bg-[#0B6E6C] hover:bg-[#085856] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs transition shrink-0"
              >
                <i className="fa-solid fa-plus text-[9px]"></i>
                <span>Catat Tanggal</span>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

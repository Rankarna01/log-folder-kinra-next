'use client';

import { useEffect, useState, useMemo } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

type Preset = {
  key: string;
  label: string;
  getRange: () => { start: Date; end: Date };
};

export function DateRangeModal({ isOpen, onClose, startDate, endDate, onApply }: Props) {
  const [tempStart, setTempStart] = useState<Date>(() => new Date(startDate || Date.now()));
  const [tempEnd, setTempEnd] = useState<Date | null>(() => new Date(endDate || Date.now()));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('Bulan Ini');

  // Month navigation: viewMonth0 is the left month (0-11), viewYear0 is the left year
  const [viewYear, setViewYear] = useState<number>(() => {
    const d = new Date(startDate || Date.now());
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const d = new Date(startDate || Date.now());
    return d.getMonth();
  });

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      setTempStart(s);
      setTempEnd(e);
      setViewYear(s.getFullYear());
      setViewMonth(s.getMonth());
    }
  }, [isOpen, startDate, endDate]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const presets: Preset[] = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    return [
      {
        key: 'Hari Ini',
        label: 'Hari Ini',
        getRange: () => {
          const t = new Date(today);
          return { start: t, end: t };
        },
      },
      {
        key: 'Kemarin',
        label: 'Kemarin',
        getRange: () => {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
          return { start: d, end: d };
        },
      },
      {
        key: '7 Hari Terakhir',
        label: '7 Hari Terakhir',
        getRange: () => {
          const s = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
          return { start: s, end: new Date(today) };
        },
      },
      {
        key: '30 Hari Terakhir',
        label: '30 Hari Terakhir',
        getRange: () => {
          const s = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
          return { start: s, end: new Date(today) };
        },
      },
      {
        key: 'Bulan Ini',
        label: 'Bulan Ini',
        getRange: () => {
          const s = new Date(y, m, 1);
          const e = new Date(y, m + 1, 0); // last day of current month
          return { start: s, end: e };
        },
      },
      {
        key: 'Bulan Lalu',
        label: 'Bulan Lalu',
        getRange: () => {
          const s = new Date(y, m - 1, 1);
          const e = new Date(y, m, 0);
          return { start: s, end: e };
        },
      },
      {
        key: 'Tahun Ini',
        label: 'Tahun Ini',
        getRange: () => {
          const s = new Date(y, 0, 1);
          const e = new Date(y, 11, 31);
          return { start: s, end: e };
        },
      },
      {
        key: 'Tahun Lalu',
        label: 'Tahun Lalu',
        getRange: () => {
          const s = new Date(y - 1, 0, 1);
          const e = new Date(y - 1, 11, 31);
          return { start: s, end: e };
        },
      },
    ];
  }, []);

  const handlePresetClick = (preset: Preset) => {
    setSelectedPreset(preset.key);
    const { start, end } = preset.getRange();
    setTempStart(start);
    setTempEnd(end);
    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Month 2 is viewMonth + 1
  const m2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const y2 = viewMonth === 11 ? viewYear + 1 : viewYear;

  const handleDateClick = (date: Date) => {
    setSelectedPreset(''); // clear preset pill
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else {
      if (date < tempStart) {
        setTempStart(date);
        setTempEnd(null);
      } else {
        setTempEnd(date);
      }
    }
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const isInRange = (d: Date) => {
    if (!tempStart) return false;
    const targetEnd = tempEnd || hoverDate;
    if (!targetEnd) return false;
    const startYmd = toYmd(tempStart);
    const endYmd = toYmd(targetEnd);
    const currentYmd = toYmd(d);

    if (startYmd <= endYmd) {
      return currentYmd > startYmd && currentYmd < endYmd;
    }
    return currentYmd > endYmd && currentYmd < startYmd;
  };

  const isStart = (d: Date) => isSameDay(d, tempStart);
  const isEnd = (d: Date) => isSameDay(d, tempEnd || (tempStart && !tempEnd ? hoverDate : null));

  // Render a calendar month grid
  const renderMonth = (year: number, month: number) => {
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete rows (up to 35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }

    return (
      <div className="flex-1 min-w-[240px]">
        <div className="text-center font-bold text-white text-sm py-2">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 font-semibold mb-2">
          {DAY_NAMES.map((dn) => (
            <div key={dn} className="py-1">
              {dn}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map(({ date, isCurrentMonth }, idx) => {
            const start = isStart(date);
            const end = isEnd(date);
            const inRange = isInRange(date);

            let bgClass = '';
            let textClass = isCurrentMonth ? 'text-zinc-200' : 'text-zinc-600';

            if (start || end) {
              bgClass = 'bg-[#008187] text-white font-bold rounded-lg shadow-sm';
              textClass = 'text-white font-bold';
            } else if (inRange) {
              bgClass = 'bg-[#008187]/25 text-white';
            }

            return (
              <div
                key={idx}
                className={`h-9 flex items-center justify-center relative cursor-pointer select-none transition-colors ${
                  inRange ? 'bg-[#008187]/20' : ''
                } ${start ? 'rounded-l-lg' : ''} ${end ? 'rounded-r-lg' : ''}`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
                onMouseEnter={() => !tempEnd && setHoverDate(date)}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center text-xs transition-all ${bgClass} ${textClass} hover:bg-[#008187]/40 hover:text-white rounded-lg`}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const appliedStart = tempStart ? toYmd(tempStart) : '';
  const appliedEnd = tempEnd ? toYmd(tempEnd) : tempStart ? toYmd(tempStart) : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181d20] border border-zinc-700/60 text-white rounded-[24px] shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Main Content: Presets Sidebar + Calendars */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left Sidebar Presets */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-zinc-700/50 p-3 sm:p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible shrink-0 no-scrollbar">
            {presets.map((p) => {
              const active = selectedPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold text-left transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#008187] text-white shadow-sm'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Right Area: Calendar Months */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div className="relative">
              {/* Navigation Arrows */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition"
                  aria-label="Bulan sebelumnya"
                >
                  <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition"
                  aria-label="Bulan berikutnya"
                >
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>

              {/* Months Container: 1 on mobile, 2 on md+ */}
              <div className="flex flex-col md:flex-row gap-6">
                {renderMonth(viewYear, viewMonth)}
                <div className="hidden md:block flex-1">{renderMonth(y2, m2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Date Preview & Actions */}
        <div className="border-t border-zinc-700/60 px-5 py-3.5 bg-[#14181b] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-2">
            <span>{appliedStart || 'Pilih tanggal awal'}</span>
            <span className="text-[#008187] font-bold">→</span>
            <span>{appliedEnd || appliedStart || 'Pilih tanggal akhir'}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={() => {
                if (appliedStart) {
                  onApply(appliedStart, appliedEnd || appliedStart);
                  onClose();
                }
              }}
              className="px-6 py-2 rounded-full text-xs font-bold bg-[#008187] hover:bg-[#006e73] text-white shadow-sm transition"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

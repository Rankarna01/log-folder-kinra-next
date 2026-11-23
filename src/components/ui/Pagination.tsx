'use client';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = 'data',
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--line-2,#e4eded)] text-xs text-[var(--muted,#587073)]">
      <div>
        Menampilkan <span className="font-bold text-[var(--ink,#0f2629)]">{startItem}</span>–
        <span className="font-bold text-[var(--ink,#0f2629)]">{endItem}</span> dari{' '}
        <span className="font-bold text-[var(--ink,#0f2629)]">{totalItems}</span> {label}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Halaman sebelumnya"
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--line-2,#e4eded)] bg-[var(--surface,#fff)] text-[var(--ink,#0f2629)] hover:border-[#008187] hover:text-[#008187] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </button>

          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-zinc-400">
                  …
                </span>
              );
            }

            const pageNum = Number(p);
            const active = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={active ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  active
                    ? 'bg-[#008187] text-white shadow-xs'
                    : 'border border-[var(--line-2,#e4eded)] bg-[var(--surface,#fff)] text-[var(--ink,#0f2629)] hover:border-[#008187] hover:text-[#008187]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Halaman berikutnya"
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--line-2,#e4eded)] bg-[var(--surface,#fff)] text-[var(--ink,#0f2629)] hover:border-[#008187] hover:text-[#008187] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      )}
    </div>
  );
}

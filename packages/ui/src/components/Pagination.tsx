import { cn } from '../lib/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('ellipsis');

  pages.push(total);

  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = getPages(currentPage, totalPages);

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => { onPageChange(currentPage - 1); }}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Previous page"
      >
        Previous
      </button>

      {pages.map((page, idx) => {
        if (page === 'ellipsis') {
          return (
            <span key={'ellipsis-' + String(idx)} className="px-2 text-muted-foreground">
              ...
            </span>
          );
        }
        return (
          <button
            key={page}
            type="button"
            onClick={() => { onPageChange(page); }}
            className={cn(
              'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm transition-colors',
              page === currentPage
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={'Page ' + String(page)}
          >
            {String(page)}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => { onPageChange(currentPage + 1); }}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}

export { Pagination };

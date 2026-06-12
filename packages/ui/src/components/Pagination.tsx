import React, { forwardRef } from 'react';
import { cn } from '../lib/cn.js';
import { Button } from './Button.js';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showEdges?: boolean;
  siblingCount?: number;
}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, currentPage, totalPages, onPageChange, showEdges = true, siblingCount = 1, ...props }, ref) => {
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const totalNumbers = siblingCount + 5;

      if (totalPages <= totalNumbers) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftRange = 1 + 2 * siblingCount;
        for (let i = 1; i <= leftRange; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightRange = totalPages - 2 * siblingCount;
        pages.push(1);
        pages.push('...');
        for (let i = rightRange; i <= totalPages; i++) {
          pages.push(i);
        }
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        pages.push(1);
        pages.push('...');
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div ref={ref} className={cn('flex items-center justify-center gap-2', className)} {...props}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {typeof page === 'number' ? (
              <Button
                key={page}
                variant={page === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Button>
            ) : (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export { Pagination };

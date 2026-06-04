'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'p-1.5 rounded-lg border border-gray-200 dark:border-gray-700',
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
            page === 1 && 'opacity-40 cursor-not-allowed',
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            'p-1.5 rounded-lg border border-gray-200 dark:border-gray-700',
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
            page === totalPages && 'opacity-40 cursor-not-allowed',
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

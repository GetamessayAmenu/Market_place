"use client"
import React, { useCallback, useEffect, useRef } from 'react';

import { cn } from '../lib/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: '280px',
  md: '380px',
  lg: '520px',
};

function Drawer({ open, onClose, side = 'right', title, children, className, size = 'md' }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-modal bg-foreground/40 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 h-full bg-background shadow-xl p-6 overflow-y-auto',
          side === 'left' ? 'left-0 animate-slide-in-left' : 'right-0 animate-slide-in-right',
          className
        )}
        style={{ width: sizeClasses[size] }}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 id="drawer-title" className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close drawer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export { Drawer };

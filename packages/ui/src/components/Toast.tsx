"use client"
import React, { createContext, useCallback, useContext, useState } from 'react';

import { cn } from '../lib/cn';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return {
    ...ctx,
    toast: (opts: { title?: string; description?: string; variant?: ToastVariant | 'destructive'; duration?: number }) => {
      const variant: ToastVariant = opts.variant === 'destructive' ? 'error' : (opts.variant ?? 'default');
      const payload: Omit<ToastItem, 'id'> = { variant };
      if (opts.title) payload.title = opts.title;
      if (opts.description) payload.description = opts.description;
      if (opts.duration) payload.duration = opts.duration;
      ctx.addToast(payload);
    },
  };
}

let toastCounter = 0;

const variantClasses: Record<ToastVariant, string> = {
  default: 'bg-background border-border text-foreground',
  success: 'bg-success/10 border-success/30 text-foreground',
  error: 'bg-destructive/10 border-destructive/30 text-foreground',
  warning: 'bg-warning/10 border-warning/30 text-foreground',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = String(++toastCounter);
      setToasts((prev) => [...prev, { ...toast, id }]);
      const duration = toast.duration ?? 5000;
      setTimeout(() => { removeToast(id); }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

function Toaster() {
  const { toasts, removeToast } = useContext(ToastContext) ?? { toasts: [], removeToast: (_id: string) => { /* noop */ } };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border p-4 shadow-lg animate-slide-in-right',
            variantClasses[toast.variant ?? 'default']
          )}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
              {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => { removeToast(toast.id); }}
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

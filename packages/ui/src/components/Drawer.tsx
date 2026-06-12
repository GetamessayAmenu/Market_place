import React, { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn.js';
import { cva } from '../lib/cva.js';

const drawerVariants = cva({
  base: 'fixed z-50 h-full bg-background border shadow-lg transition-transform duration-300 ease-in-out',
  variants: {
    side: {
      left: 'left-0 top-0 border-r animate-in slide-in-from-left',
      right: 'right-0 top-0 border-l animate-in slide-in-from-right',
    },
  },
  defaultVariants: {
    side: 'right',
  },
});

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, isOpen, onClose, side = 'right', closeOnEscape = true, closeOnOverlayClick = true, children, ...props }, ref) => {
    const drawerRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        drawerRef.current?.focus();
      } else {
        previousActiveElement.current?.focus();
      }
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, closeOnEscape]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    return createPortal(
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={handleOverlayClick}
        />
        <div
          ref={(node) => {
            drawerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn(drawerVariants({ side }), 'w-80', className)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);

Drawer.displayName = 'Drawer';

export { Drawer, drawerVariants };

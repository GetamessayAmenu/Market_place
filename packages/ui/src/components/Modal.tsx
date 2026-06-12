import React, { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn.js';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, closeOnEscape = true, closeOnOverlayClick = true, children, ...props }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        modalRef.current?.focus();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={handleOverlayClick}
        />
        <div
          ref={(node) => {
            modalRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn(
            'relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg animate-in scale-in fade-in slide-in-from-bottom-4',
            className
          )}
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

Modal.displayName = 'Modal';

export { Modal };

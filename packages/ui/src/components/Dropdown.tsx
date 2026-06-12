import React, { createContext, useContext, useState, useRef, useEffect, forwardRef, cloneElement } from 'react';
import { cn } from '../lib/cn.js';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown provider');
  }
  return context;
};

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(({ children, className, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div ref={ref} className={cn('relative inline-block text-left', className)} {...props}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
});

Dropdown.displayName = 'Dropdown';

export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const { isOpen, setIsOpen, triggerRef } = useDropdownContext();

    if (asChild && React.isValidElement(children)) {
      return cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => {
          setIsOpen((prev: boolean) => !prev);
          (children as React.ReactElement<any>).props.onClick?.(e);
        },
        'aria-haspopup': true,
        'aria-expanded': isOpen,
      });
    }

    return (
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('inline-flex items-center justify-center', className)}
        onClick={() => setIsOpen((prev: boolean) => !prev)}
        aria-haspopup
        aria-expanded={isOpen}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DropdownTrigger.displayName = 'DropdownTrigger';

const DropdownContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = useDropdownContext();

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg animate-in fade-in zoom-in-95',
          'z-50',
          className
        )}
        {...props}
      >
        <div className="py-1">{children}</div>
      </div>
    );
  }
);

DropdownContent.displayName = 'DropdownContent';

const DropdownItem = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { setIsOpen } = useDropdownContext();

    return (
      <button
        ref={ref}
        className={cn(
          'block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:bg-accent focus:text-accent-foreground',
          className
        )}
        onClick={(e) => {
          setIsOpen(false);
          props.onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

const DropdownSeparator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('h-px bg-border my-1', className)} {...props} />
  )
);

DropdownSeparator.displayName = 'DropdownSeparator';

export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator };

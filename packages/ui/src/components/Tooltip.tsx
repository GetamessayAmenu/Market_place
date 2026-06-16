"use client"
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { cn } from '../lib/cn';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-popover border-x-transparent border-b-transparent border-4',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-popover border-x-transparent border-t-transparent border-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-popover border-y-transparent border-r-transparent border-4',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-popover border-y-transparent border-l-transparent border-4',
};

function Tooltip({ content, position = 'top', delay = 200, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => { setIsVisible(true); }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}
      {isVisible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-tooltip whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md',
            'animate-fade-in pointer-events-none',
            positionClasses[position],
            className
          )}
        >
          {content}
          <span className={cn('absolute h-0 w-0', arrowClasses[position])} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

export { Tooltip };

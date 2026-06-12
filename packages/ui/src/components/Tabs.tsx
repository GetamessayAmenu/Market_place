"use client"
import React, { forwardRef, useCallback, useRef } from 'react';

import { cn } from '../lib/cn';

export interface Tab {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, value, onChange, className, children }, ref) => {
    const tabListRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabledTabs = tabs.filter((t) => !t.disabled);
        const currentIndex = enabledTabs.findIndex((t) => t.value === value);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % enabledTabs.length;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
        } else if (e.key === 'Home') {
          nextIndex = 0;
        } else if (e.key === 'End') {
          nextIndex = enabledTabs.length - 1;
        } else {
          return;
        }

        e.preventDefault();
        const nextTab = enabledTabs[nextIndex];
        if (nextTab) onChange(nextTab.value);
      },
      [tabs, value, onChange]
    );

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div
          ref={tabListRef}
          role="tablist"
          className="flex border-b"
          onKeyDown={handleKeyDown}
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={value === tab.value}
              aria-controls={'tabpanel-' + tab.value}
              tabIndex={value === tab.value ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => { if (!tab.disabled) onChange(tab.value); }}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:pointer-events-none',
                value === tab.value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {children && (
          <div role="tabpanel" id={'tabpanel-' + value} className="mt-4" tabIndex={0}>
            {children}
          </div>
        )}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export { Tabs };

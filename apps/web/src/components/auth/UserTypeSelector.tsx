"use client"
import { cn } from '@marketplace/ui';
import React from 'react';

export type UserType = 'buyer' | 'seller';

export interface UserTypeSelectorProps {
  value: UserType;
  onChange: (type: UserType) => void;
  disabled?: boolean;
  className?: string;
}

const options: { value: UserType; icon: React.ReactNode; title: string; description: string }[] = [
  {
    value: 'buyer',
    title: 'Buy',
    description: 'Browse and purchase fashion from local designers and boutiques',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    value: 'seller',
    title: 'Sell',
    description: 'List your designs, manage orders, and grow your business',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
];

export default function UserTypeSelector({ value, onChange, disabled, className }: UserTypeSelectorProps) {
  return (
    <fieldset className={cn('space-y-2', className)} disabled={disabled}>
      <legend className="block text-sm font-medium text-foreground mb-2">
        I want to
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center cursor-pointer transition-all',
                'hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type="radio"
                name="userType"
                value={opt.value}
                checked={isSelected}
                onChange={() => { onChange(opt.value) }}
                className="sr-only"
                disabled={disabled}
              />
              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <span className={cn(
                'transition-colors',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {opt.icon}
              </span>
              <span className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-foreground' : 'text-card-foreground'
              )}>
                {opt.title}
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed hidden sm:block">
                {opt.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

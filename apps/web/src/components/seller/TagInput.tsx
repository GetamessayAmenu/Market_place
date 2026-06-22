"use client"
import { Badge, cn } from '@marketplace/ui';
import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TagInputProps {
  label: string;
  description?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  error?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TagInput({
  label,
  description,
  value,
  onChange,
  maxTags = 10,
  placeholder = 'Type and press Enter',
  error,
}: TagInputProps) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input.trim());
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      const lastTag = value[value.length - 1];
      if (lastTag) {
        onChange(value.slice(0, -1));
      }
    }
  }

  function addTag(raw: string) {
    const tag = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
    if (!tag) return;
    if (value.includes(tag)) return;
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {description && <p className="mb-2 text-xs text-muted-foreground">{description}</p>}

      <div className={cn(
        'flex flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30',
        error !== undefined && 'border-destructive'
      )}>
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => { removeTag(tag); }}
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={'Remove ' + tag}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Badge>
        ))}

        {value.length < maxTags && (
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); }}
            onKeyDown={handleKeyDown}
            onBlur={() => { addTag(input.trim()); }}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[80px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>

      {error !== undefined && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{value.length}/{maxTags} tags</p>
    </div>
  );
}

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@marketplace/ui';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string | undefined;
  autoFocus?: boolean;
  enableWebOTP?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = true,
  enableWebOTP = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // WebOTP API for native auto-fill (Chrome/Android)
  useEffect(() => {
    if (!enableWebOTP || typeof window === 'undefined' || !('OTPCredential' in window)) {
      return undefined;
    }

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 120000); // 2 minute timeout

    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      } as CredentialRequestOptions)
      .then((otp) => {
        if (otp && typeof otp === 'object' && 'code' in otp) {
          const code = (otp as { code: string }).code;
          onChange(code);
          onComplete?.(code);
        }
      })
      .catch((err) => {
        // Silently fail - user can still enter manually
        console.debug('WebOTP not available or cancelled:', err);
      });

    return () => {
      clearTimeout(timeout);
      ac.abort();
    };
  }, [enableWebOTP, onChange, onComplete]);

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const numericValue = newValue.replace(/\D/g, '');

      if (numericValue.length === 0) {
        onChange(value.slice(0, index) + value.slice(index + 1));
        return;
      }

      if (numericValue.length === 1) {
        const newValueArray = value.split('');
        newValueArray[index] = numericValue;
        onChange(newValueArray.join(''));

        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        } else if (onComplete) {
          onComplete(newValueArray.join(''));
        }
      } else if (numericValue.length > 1) {
        const newValueArray = value.split('');
        for (let i = 0; i < Math.min(numericValue.length, length - index); i++) {
          const char = numericValue[i];
          if (char !== undefined) {
            newValueArray[index + i] = char;
          }
        }
        onChange(newValueArray.join(''));

        const nextFocusIndex = Math.min(index + numericValue.length, length - 1);
        inputRefs.current[nextFocusIndex]?.focus();
      }
    },
    [value, length, onChange, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === 'Home') {
        inputRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        inputRefs.current[length - 1]?.focus();
      }
    },
    [length]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
      if (pastedData.length === length) {
        onChange(pastedData);
        inputRefs.current[length - 1]?.focus();
        onComplete?.(pastedData);
      } else if (pastedData.length > 0) {
        // Handle partial paste
        const newValueArray = value.split('');
        const pasteLength = Math.min(pastedData.length, length);
        for (let i = 0; i < pasteLength; i++) {
          newValueArray[i] = pastedData[i] ?? '';
        }
        onChange(newValueArray.join(''));
        const nextFocusIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[nextFocusIndex]?.focus();
      }
    },
    [length, onChange, onComplete, value]
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold rounded-lg border',
            'focus:outline-none focus:ring-2 focus:ring-brand-gold/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-destructive focus:ring-destructive',
            !error && 'border-input',
            focusedIndex === index && 'ring-2 ring-brand-gold/50'
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={!!error}
        />
      ))}
    </div>
  );
}

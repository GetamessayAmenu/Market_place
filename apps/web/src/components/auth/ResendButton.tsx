"use client"
import { cn } from '@marketplace/ui';
import React, { useCallback, useEffect, useState } from 'react';

export interface ResendButtonProps {
  onResend: () => Promise<void>;
  label?: string;
  cooldownSeconds?: number;
  maxAttempts?: number;
  className?: string;
}

/**
 * Button with cooldown timer for resending verification/reset emails.
 */
export default function ResendButton({
  onResend,
  label = 'Resend email',
  cooldownSeconds = 60,
  maxAttempts = 3,
  className,
}: ResendButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => { clearInterval(timer) };
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || attempts >= maxAttempts || sending) return;
    setSending(true);
    setSuccess(false);
    try {
      await onResend();
      setSuccess(true);
      setAttempts((a) => a + 1);
      setCooldown(cooldownSeconds);
      setTimeout(() => { setSuccess(false) }, 3000);
    } catch {
      // Parent handles error display
    } finally {
      setSending(false);
    }
  }, [onResend, cooldown, attempts, maxAttempts, sending, cooldownSeconds]);

  const maxed = attempts >= maxAttempts;

  return (
    <div className={cn('text-center', className)}>
      {success && (
        <p className="text-sm text-brand-green mb-2" aria-live="polite">
          Email sent! Check your inbox.
        </p>
      )}
      {maxed ? (
        <p className="text-sm text-muted-foreground">
          Maximum resends reached. Contact{' '}
          <a href="mailto:support@habeshamarket.com" className="text-primary hover:underline">
            support
          </a>
        </p>
      ) : cooldown > 0 ? (
        <p className="text-sm text-muted-foreground">
          {label} available in{' '}
          <span className="font-mono font-medium text-foreground">
            {String(Math.floor(cooldown / 60))}:{String(cooldown % 60).padStart(2, '0')}
          </span>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => { void handleResend() }}
          disabled={sending}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {sending ? 'Sending...' : label}
        </button>
      )}
    </div>
  );
}

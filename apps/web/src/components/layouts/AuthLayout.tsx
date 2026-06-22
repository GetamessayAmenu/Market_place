import Link from 'next/link';
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Hide back-to-home link */
  hideBack?: boolean;
}

export default function AuthLayout({ children, title, subtitle, hideBack }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col fashion-md:flex-row">
      {/* Brand panel — visible on desktop only */}
      <div className="hidden fashion-md:flex fashion-md:w-[45%] flex-col justify-between bg-gradient-to-br from-brand-wine via-brand-terra to-brand-gold p-10 relative overflow-hidden">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern id="auth-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0L40 20L20 40L0 20Z" stroke="white" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#auth-pattern)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="font-display text-3xl font-bold text-white tracking-tight">
            Habesha Market
          </Link>
          <p className="mt-2 text-sm text-white/80">Ethiopian Fashion Marketplace</p>
        </div>

        {/* Social proof */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-lg font-display text-white/90 italic leading-relaxed">
            &ldquo;Join thousands of Ethiopian fashion lovers discovering unique designs from local artisans.&rdquo;
          </blockquote>
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-xs text-white/70">Active users</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-white/70">Designers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-xs text-white/70">Items sold</p>
            </div>
          </div>
        </div>

        {/* Bottom link */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-brand-ivory/30 to-muted/40 px-4 py-8 fashion-md:px-12">
        {/* Back to home — mobile only */}
        {!hideBack && (
          <div className="absolute top-6 left-6 fashion-md:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Logo — mobile only */}
          <div className="mb-8 text-center fashion-md:hidden">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
              Habesha Market
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">Ethiopian Fashion Marketplace</p>
          </div>

          {/* Card */}
          <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm" role="main" id="auth-form">
            <div className="mb-6">
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-card-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {/* aria-live region for screen reader announcements */}
            <div aria-live="polite" aria-atomic="true">
              {children}
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <span aria-hidden="true">&middot;</span>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span aria-hidden="true">&middot;</span>
              <Link href="/help" className="hover:text-foreground transition-colors">
                Help
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Habesha Market. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

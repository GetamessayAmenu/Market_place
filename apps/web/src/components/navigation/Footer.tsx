import { Divider } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

const footerSections = [
  {
    title: 'Shop',
    links: [
      { label: 'Buy Fashion', href: '/search?type=buy' },
      { label: 'Rent Fashion', href: '/search?type=rent' },
      { label: 'Custom Orders', href: '/search?type=custom' },
      { label: 'Categories', href: '/categories' },
      { label: 'Designers', href: '/designers' },
    ],
  },
  {
    title: 'For Sellers',
    links: [
      { label: 'Start Selling', href: '/dashboard/seller' },
      { label: 'For Designers', href: '/sell/designers' },
      { label: 'For Tailors', href: '/sell/tailors' },
      { label: 'For Boutiques', href: '/sell/boutiques' },
      { label: 'For Rental Shops', href: '/sell/rental' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Messages', href: '/dashboard/messages' },
      { label: 'Saved Items', href: '/dashboard/saved' },
      { label: 'Settings', href: '/dashboard/settings' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-brand-gold/20 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-xl font-display font-bold tracking-tight">
                Habesha Market
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                The premier Ethiopian fashion marketplace. Buy, rent, and order custom fashion from talented designers and tailors.
              </p>
            </div>

            {/* Link sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Habesha Market. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Social icons */}
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Telegram">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

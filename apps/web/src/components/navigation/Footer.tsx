import Link from 'next/link';
import React from 'react';

const footerSections = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Browse', href: '/search' },
      { label: 'Categories', href: '/categories' },
      { label: 'Sellers', href: '/sellers' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Messages', href: '/dashboard/messages' },
      { label: 'Settings', href: '/dashboard/settings' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container-responsive py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-bold">
              Marketplace
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Find great local deals. Buy and sell with confidence.
            </p>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-3 space-y-2">
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

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

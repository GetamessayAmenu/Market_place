'use client';

import React from 'react';
import Link from 'next/link';
import { Drawer } from '@marketplace/ui';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="right">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-4">
            <li>
              <Link
                href="/"
                onClick={onClose}
                className="block py-2 text-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                onClick={onClose}
                className="block py-2 text-foreground hover:text-primary transition-colors"
              >
                Browse
              </Link>
            </li>
            <li>
              <Link
                href="/categories"
                onClick={onClose}
                className="block py-2 text-foreground hover:text-primary transition-colors"
              >
                Categories
              </Link>
            </li>
            <li>
              <Link
                href="/sellers"
                onClick={onClose}
                className="block py-2 text-foreground hover:text-primary transition-colors"
              >
                Sellers
              </Link>
            </li>
            <li className="pt-4 border-t">
              <Link
                href="/login"
                onClick={onClose}
                className="block py-2 text-foreground hover:text-primary transition-colors"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                onClick={onClose}
                className="block py-2 text-foreground hover:text-primary transition-colors"
              >
                Sign Up
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </Drawer>
  );
}

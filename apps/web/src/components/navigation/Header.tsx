"use client"

import { cn } from '@marketplace/ui'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect, useState } from 'react'

import MobileNav from './MobileNav'
import NotificationBell from './NotificationBell'
import UserMenu from './UserMenu'

function HeaderNavLinks() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentType = searchParams.get('type') ?? ''
  const isSearchPage = pathname === '/search'

  const navLinks = [
    {
      href: '/search?type=buy',
      label: 'Shop',
      isActive: isSearchPage && (!currentType || currentType === 'buy'),
    },
    {
      href: '/search?type=rent',
      label: 'Rent',
      isActive: isSearchPage && currentType === 'rent',
    },
    {
      href: '/search?type=custom',
      label: 'Custom Order',
      isActive: isSearchPage && currentType === 'custom',
    },
    {
      href: '/designers',
      label: 'Designers',
      isActive: pathname.startsWith('/designers'),
    },
  ]

  return (
    <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main navigation">
      {navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={cn(
            'font-medium transition-colors hover:text-emerald-600',
            link.isActive
              ? 'text-emerald-600 font-bold border-b-2 border-emerald-600 pb-0.5'
              : 'text-foreground/70'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function HeaderNavFallback() {
  return (
    <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main navigation">
      <Link href="/search?type=buy" className="font-medium text-foreground/70 hover:text-emerald-600">Shop</Link>
      <Link href="/search?type=rent" className="font-medium text-foreground/70 hover:text-emerald-600">Rent</Link>
      <Link href="/search?type=custom" className="font-medium text-foreground/70 hover:text-emerald-600">Custom Order</Link>
      <Link href="/designers" className="font-medium text-foreground/70 hover:text-emerald-600">Designers</Link>
    </nav>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'sticky top-0 w-full transition-all duration-300 z-50',
          isHome && !scrolled
            ? 'bg-background/95 backdrop-blur border-b border-border shadow-xs'
            : 'bg-background/95 backdrop-blur border-b border-border shadow-xs'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-extrabold">Habesha</span>
              <span className="font-extrabold text-foreground">Market</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <Suspense fallback={<HeaderNavFallback />}>
            <HeaderNavLinks />
          </Suspense>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Sell Your Item Button */}
            <Link
              href="/sell"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50/50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/60"
            >
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Sell Your Item</span>
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/dashboard/favorites"
              className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-foreground transition-colors relative"
              aria-label="Saved Items"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Messages Icon */}
            <Link
              href="/dashboard/messages"
              className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-foreground transition-colors relative"
              aria-label="Messages"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>

            {/* Notifications */}
            <NotificationBell />

            {/* User Profile */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-foreground/70 hover:bg-muted md:hidden"
              aria-label="Open navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

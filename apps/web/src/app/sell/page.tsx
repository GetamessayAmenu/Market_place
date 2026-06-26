import Link from 'next/link'
import React from 'react'

import Container from '../../components/Container'
import EarningsCalculator from '../../components/seller-landing/EarningsCalculator'
import SellerFAQ from '../../components/seller-landing/SellerFAQ'

export function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    title: 'Sell on Habesha Market — Ethiopia\'s #1 Fashion Marketplace',
    description: 'Join thousands of Ethiopian fashion designers, tailors, and boutiques selling on Habesha Market. Sell products, offer rentals, and take custom orders — all from one powerful platform.',
    openGraph: {
      title: 'Sell on Habesha Market — Ethiopia\'s Fashion Marketplace',
      description: 'Start selling Ethiopian fashion online. Free to join, powerful seller tools, built-in buyer trust.',
      url: `${siteUrl}/sell`,
      siteName: 'Habesha Market',
      type: 'website',
    },
    alternates: { canonical: `${siteUrl}/sell` },
  }
}

/* ─── Icon helpers (inline SVG, no extra deps) ─── */
function Icon({ path, className = 'h-6 w-6' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  )
}

const ICONS = {
  store: 'M3 3h18v4H3V3zm0 4v14h18V7H3zm4 4h2v6H7v-6zm4 0h2v6h-2v-6zm4 0h2v6h-2v-6z',
  upload: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4',
  cash: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
  check: 'M5 13l4 4L19 7',
  trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  ruler: 'M1 7l5-5 5 5M1 7l5 5 5-5m-5-5v20m8-16l5-5 5 5M14 7l5 5 5-5m-5-5v20',
  layout: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z',
  list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  pie: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
}

function StarRating() {
  return (
    <div className="flex items-center gap-0.5 text-brand-gold" aria-label="5 star rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function SellPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — Hero
          Purpose: Immediate value proposition, primary CTA, trust signals
          Ethiopian consideration: Amharic tagline, local payment logos
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-brand-gold py-16 md:py-24 lg:py-32">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <Container className="relative z-10 text-center">
          {/* Trust pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 mb-8">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Trusted by 2,000+ Ethiopian sellers
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight">
            Turn Your Craft Into a Thriving Business
          </h1>
          <p className="mt-2 font-display text-lg md:text-xl text-white/70 italic">
            ጥበብዎን ወደ ንግድ ይቀይሩ
          </p>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Ethiopia&apos;s premier fashion marketplace. Sell ready-to-wear, rent occasion outfits, and take custom orders — all from one powerful seller dashboard. No monthly fees, no tech skills required.
          </p>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=seller"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
            >
              Start Selling Free
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              See How It Works
            </a>
          </div>

          {/* Trust indicators row */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Icon path={ICONS.check} className="h-4 w-4" /> Free to join
            </span>
            <span className="flex items-center gap-2">
              <Icon path={ICONS.check} className="h-4 w-4" /> No monthly fees
            </span>
            <span className="flex items-center gap-2">
              <Icon path={ICONS.check} className="h-4 w-4" /> 10% commission only on sales
            </span>
            <span className="flex items-center gap-2">
              <Icon path={ICONS.check} className="h-4 w-4" /> Telebirr & CBE Birr payouts
            </span>
          </div>
        </Container>
      </section>

      <Container>
        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — How It Works
            Purpose: Demystify the selling process in 3 simple steps
            Ethiopian consideration: Emphasis on simplicity for first-time online sellers
        ═══════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-16 md:py-24" aria-labelledby="hiw-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Getting Started</p>
            <h2 id="hiw-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Start Selling in 3 Simple Steps
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              No technical skills needed. If you can take a photo and send a message, you can sell on Habesha Market.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border bg-card p-8 text-center group hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-md">
                1
              </div>
              <div className="mx-auto mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon path={ICONS.store} className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Create Your Shop</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Sign up free, complete your seller profile, and get verified in minutes. Add your brand name, logo, and story. Choose your seller type — designer, tailor, boutique, or rental shop.
              </p>
              <p className="mt-3 text-xs font-medium text-primary">⏱ Takes less than 5 minutes</p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border bg-card p-8 text-center group hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-md">
                2
              </div>
              <div className="mx-auto mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon path={ICONS.camera} className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">List Your Products</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Upload photos of your products, set your prices, and add descriptions. Enable sales, rentals, or custom orders on each listing. Our smart form guides you through every field.
              </p>
              <p className="mt-3 text-xs font-medium text-primary">📸 Just snap & upload</p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border bg-card p-8 text-center group hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-md">
                3
              </div>
              <div className="mx-auto mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon path={ICONS.cash} className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Get Orders & Earn</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Buyers discover your products through search and categories. Receive orders, chat with customers, ship products, and get paid directly to your Telebirr, CBE Birr, or bank account.
              </p>
              <p className="mt-3 text-xs font-medium text-primary">💰 Payouts every 7 days</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2B — Seller Dashboard Preview
            Purpose: Show sellers what they'll be working with before they start
            Helps new sellers understand the tools available to them
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 rounded-3xl bg-primary/5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" aria-labelledby="dashboard-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Your Command Center</p>
            <h2 id="dashboard-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need in One Dashboard
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Your seller dashboard is where you manage your entire business. Here&apos;s what you&apos;ll have access to from day one.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ICONS.list,
                title: 'Manage Your Listings',
                desc: 'Create, edit, and organize all your products from one place. Toggle between selling, renting, or accepting custom orders on each listing. Track inventory levels and listing performance.',
                bullets: ['Create listings in minutes', 'Edit prices anytime', 'Enable/disable selling, renting, or custom orders'],
              },
              {
                icon: ICONS.clipboard,
                title: 'Track Orders & Custom Requests',
                desc: 'See all incoming orders, rental bookings, and custom order requests. Update order status, confirm custom order pricing, and manage your production schedule.',
                bullets: ['Real-time order notifications', 'Custom order workflow tracking', 'Rental calendar management'],
              },
              {
                icon: ICONS.chat,
                title: 'Chat With Buyers',
                desc: 'Respond to buyer questions, discuss custom order details, and build relationships — all within the platform. No need to share personal phone numbers.',
                bullets: ['Instant messaging with buyers', 'Share images and order updates', 'Keep all conversations organized'],
              },
              {
                icon: ICONS.pie,
                title: 'Analytics & Insights',
                desc: 'Understand what&apos;s working. Track your views, sales, conversion rates, and revenue with clear charts and numbers. Use insights to grow your business.',
                bullets: ['Sales & revenue charts', 'Listing view counts', 'Top-performing products'],
              },
              {
                icon: ICONS.image,
                title: 'Product Image Upload',
                desc: 'Upload up to 10 high-quality photos per listing. Show your products from every angle — front, back, detail shots, and lifestyle photos help buyers decide.',
                bullets: ['Drag-and-drop image upload', 'Up to 10 photos per listing', 'Set your primary image'],
              },
              {
                icon: ICONS.cash,
                title: 'Earnings & Payouts',
                desc: 'See your total earnings, pending payouts, and withdrawal history. Request payouts to your Telebirr, CBE Birr, or bank account whenever you&apos;re ready.',
                bullets: ['Real-time earnings tracking', 'Payout to mobile money or bank', 'Clear commission breakdown (10%)'],
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon path={item.icon} />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                <ul className="mt-3 space-y-1.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-foreground">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} /></svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/dashboard/seller"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Preview the Seller Dashboard
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — Why Sell Here
            Purpose: Differentiate from competitors, address seller pain points
            Ethiopian consideration: Focus on local market reach and diaspora access
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="why-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">The Habesha Advantage</p>
            <h2 id="why-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Why Sellers Choose Habesha Market
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Built specifically for Ethiopian fashion — we understand your market, your customers, and your craft.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ICONS.users, title: 'Built-In Buyer Audience', desc: 'Access thousands of fashion-conscious Ethiopian buyers actively searching for quality local designs. Plus reach the Ethiopian diaspora worldwide.' },
              { icon: ICONS.shield, title: 'Seller Protection Program', desc: 'Every transaction is protected. Dispute resolution, deposit security for rentals, and our Seller Guarantee ensure you never lose money unfairly.' },
              { icon: ICONS.cash, title: 'Fast, Local Payouts', desc: 'Get paid through Telebirr, CBE Birr, or direct bank transfer. No international payment headaches. Withdraw your earnings anytime.' },
              { icon: ICONS.chat, title: 'Direct Buyer Communication', desc: 'Built-in messaging system lets you chat directly with buyers, discuss custom orders, and build lasting customer relationships.' },
              { icon: ICONS.trending, title: 'Powerful Seller Analytics', desc: 'Track your sales, views, conversion rates, and revenue with our intuitive dashboard. Make data-driven decisions to grow your business.' },
              { icon: ICONS.globe, title: 'Multi-Model Selling', desc: 'Sell products, rent outfits, and accept custom orders — all from one platform. Maximize revenue by offering multiple ways to buy.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon path={item.icon} />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — Sell Products
            Purpose: Showcase product sales model with green action color
            Ethiopian consideration: Habesha Kemis, suits, accessories examples
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 rounded-3xl bg-green-50 dark:bg-green-950/20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" aria-labelledby="sell-products-heading">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 mb-4">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Product Sales
              </div>
              <h2 id="sell-products-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Sell Your Ready-to-Wear Collections
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                From stunning Habesha Kemis to modern streetwear, list your finished products and start selling immediately. Set your price, upload photos, and let buyers come to you.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Unlimited product listings with up to 10 photos each',
                  'Smart pricing suggestions based on market data',
                  'Automatic inventory tracking and low-stock alerts',
                  'Featured listing options for maximum visibility',
                  'Integrated shipping label generation',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register?role=seller"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                Start Selling Products
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            {/* Visual mock */}
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Example Listing</span>
                <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">Buy</span>
              </div>
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-950/10 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Icon path={ICONS.store} className="h-16 w-16 text-green-300 mx-auto" />
                  <p className="mt-2 text-sm text-green-400">Product Photo</p>
                </div>
              </div>
              <h4 className="font-semibold text-foreground">Embroidered Habesha Kemis — White & Gold</h4>
              <p className="text-sm text-muted-foreground mt-1">Hand-embroidered traditional dress with tilf pattern</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl font-bold text-green-600">4,500 ETB</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <StarRating />
                  <span>(47)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 5 — Rent Products
            Purpose: Showcase rental model with gold action color
            Ethiopian consideration: Wedding/event rentals are popular in Ethiopia
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="rent-products-heading">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Visual mock (order swapped on mobile) */}
            <div className="order-2 lg:order-1 rounded-2xl border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">Example Listing</span>
                <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold">Rent</span>
              </div>
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Icon path={ICONS.calendar} className="h-16 w-16 text-brand-gold/40 mx-auto" />
                  <p className="mt-2 text-sm text-brand-gold/60">Rental Calendar</p>
                </div>
              </div>
              <h4 className="font-semibold text-foreground">Premium Wedding Suit Set — Navy & Gold</h4>
              <p className="text-sm text-muted-foreground mt-1">3-piece suit with accessories, perfect for weddings</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold text-brand-gold">800 ETB</span>
                  <span className="text-sm text-muted-foreground">/day</span>
                </div>
                <span className="text-xs text-muted-foreground">Deposit: 3,000 ETB</span>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold mb-4">
                <span className="h-2 w-2 rounded-full bg-brand-gold" />
                Product Rentals
              </div>
              <h2 id="rent-products-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Earn More With Product Rentals
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Wedding dresses, graduation gowns, traditional ceremony outfits — items worn once sell repeatedly as rentals. Earn daily income while keeping your inventory.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Set daily rental rates and maximum rental duration',
                  'Built-in calendar management for booking availability',
                  'Automatic security deposit collection from renters',
                  'Damage claim resolution with photo evidence',
                  'Return logistics coordination built into the platform',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-brand-gold mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register?role=seller"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-gold/90"
              >
                Start Renting Products
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 6 — Custom-Made Orders
            Purpose: Showcase custom order capability with wine action color
            Ethiopian consideration: Tailoring is huge — most people get clothes custom-made
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 rounded-3xl bg-brand-wine/5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" aria-labelledby="custom-heading">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-wine/10 px-4 py-2 text-sm font-semibold text-brand-wine mb-4">
                <span className="h-2 w-2 rounded-full bg-brand-wine" />
                Custom Orders
              </div>
              <h2 id="custom-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Take Custom-Made Orders Online
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Most Ethiopian fashion is custom-made. Now you can accept orders with measurements, fabric choices, and design specifications — all through an organized online system. No more lost measurements on paper.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Structured measurement form — chest, waist, hips, shoulders, and more',
                  'Fabric and color selection with visual swatches',
                  'Buyers upload reference images for exact designs',
                  'Built-in price estimator with designer confirmation',
                  'Production timeline tracking from order to delivery',
                  'Direct chat with buyers at every step',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-brand-wine mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register?role=seller"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-wine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-wine/90"
              >
                Start Taking Custom Orders
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            {/* Visual mock */}
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-brand-wine uppercase tracking-wider">Custom Order Flow</span>
                <span className="rounded-full bg-brand-wine/10 px-3 py-1 text-xs font-semibold text-brand-wine">Custom</span>
              </div>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Buyer Submits Measurements', desc: 'Chest, waist, hips, length — in cm or inches', icon: ICONS.ruler },
                  { step: '2', label: 'Choose Fabric & Design', desc: 'Browse swatches, upload reference photos', icon: ICONS.camera },
                  { step: '3', label: 'Price & Timeline Confirmed', desc: 'Designer confirms price and production days', icon: ICONS.cash },
                  { step: '4', label: 'Production & Delivery', desc: 'Track progress with built-in chat', icon: ICONS.truck },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3 rounded-lg bg-brand-wine/5 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-wine/20 text-brand-wine text-xs font-bold">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 6B — Tips for Success
            Purpose: Educate first-time sellers on best practices
            Gives sellers practical ideas before they start listing
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="tips-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
              <Icon path={ICONS.lightbulb} className="h-4 w-4 inline-block mr-1" />
              Seller Tips
            </p>
            <h2 id="tips-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Tips for a Successful Start
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Follow these proven tips from top-performing Ethiopian sellers to get more views, more orders, and better reviews from day one.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Tip 1: Photos */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                <Icon path={ICONS.camera} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Take Great Photos</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Your photos are the #1 factor in whether buyers click on your listing. Use natural light, a clean background, and show the product from multiple angles. For clothing, photograph on a person or mannequin — not just flat on the floor.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Use daylight', 'Clean background', 'Show detail shots', 'Multiple angles'].map((tip) => (
                    <span key={tip} className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-medium text-brand-gold">{tip}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tip 2: Descriptions */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <Icon path={ICONS.tag} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Write Clear Descriptions</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Tell buyers exactly what they&apos;re getting. Include fabric type, size measurements, color details, and care instructions. Mention if the item is handmade, how long it takes to make, and what makes it special.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Fabric & material', 'Exact measurements', 'Color accuracy', 'Care instructions'].map((tip) => (
                    <span key={tip} className="rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">{tip}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tip 3: Pricing */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon path={ICONS.cash} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Price Competitively</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Research what similar items sell for on the marketplace. Your first few listings should be competitively priced to build reviews and reputation. Once you have a track record, you can raise prices based on demand.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Research competitors', 'Factor in your time', 'Account for materials', 'Start competitive'].map((tip) => (
                    <span key={tip} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{tip}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tip 4: Response Time */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-wine/10 text-brand-wine">
                <Icon path={ICONS.chat} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Respond Quickly</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Buyers who get a response within 1 hour are 5× more likely to place an order. Keep notifications on and reply promptly to messages and custom order requests. Quick responses lead to better reviews and repeat customers.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Enable notifications', 'Reply within 1 hour', 'Be friendly & professional', 'Confirm orders fast'].map((tip) => (
                    <span key={tip} className="rounded-full bg-brand-wine/10 px-3 py-1 text-xs font-medium text-brand-wine">{tip}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tip 5: Complete Your Profile */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon path={ICONS.shield} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Complete Your Seller Profile</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Buyers trust sellers with complete profiles. Add your shop name, a professional logo or photo, your city, and a short bio about your craft. Verified sellers with complete profiles get 3× more orders.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Add your logo', 'Write your story', 'Verify your identity', 'List your specialties'].map((tip) => (
                    <span key={tip} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{tip}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tip 6: Use All 3 Models */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                <Icon path={ICONS.globe} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Use All Three Selling Models</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Don&apos;t limit yourself to just one model. List finished products for sale, offer premium items for rent (especially wedding and event wear), and accept custom orders. The more ways buyers can work with you, the more you earn.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Sell ready-made items', 'Rent occasion wear', 'Accept custom orders', 'Mix & match'].map((tip) => (
                    <span key={tip} className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-medium text-brand-gold">{tip}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 7 — Success Stories
            Purpose: Social proof from real Ethiopian sellers
            Ethiopian consideration: Diverse seller types, local city names
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="stories-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Seller Success</p>
            <h2 id="stories-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Sellers Who Transformed Their Business
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Real stories from Ethiopian designers, tailors, and shop owners who grew their business on Habesha Market.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: 'Tigist Bekele',
                type: 'Fashion Designer',
                city: 'Addis Ababa',
                quote: 'Before Habesha Market, I only sold to customers who walked into my small shop. Now I receive orders from Bahir Dar, Hawassa, and even from Ethiopians living in the US. My monthly revenue has tripled in 6 months.',
                metric: '3× revenue growth',
                stars: 5,
              },
              {
                name: 'Yohannes Tesfaye',
                type: 'Rental Shop Owner',
                city: 'Bahir Dar',
                quote: 'I started with 10 suits for rent. The platform handles bookings, deposits, and returns so smoothly. I now have 50+ items listed and my rental income covers my family\'s needs comfortably. The deposit protection gives me peace of mind.',
                metric: '50+ items rented monthly',
                stars: 5,
              },
              {
                name: 'Meron Alemu',
                type: 'Tailor & Custom Designer',
                city: 'Hawassa',
                quote: 'The custom order system changed everything. Before, customers had to visit my shop 3-4 times for measurements and fittings. Now they submit everything online, I confirm the price, and deliver beautiful Habesha Kemis right to their door.',
                metric: '40+ custom orders/month',
                stars: 5,
              },
            ].map((story) => (
              <div key={story.name} className="rounded-2xl border bg-card p-6 flex flex-col">
                <StarRating />
                <p className="mt-4 text-sm text-muted-foreground italic leading-relaxed flex-1">
                  &ldquo;{story.quote}&rdquo;
                </p>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {story.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{story.name}</p>
                      <p className="text-xs text-muted-foreground">{story.type} · {story.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                    <Icon path={ICONS.trending} className="h-3 w-3" />
                    {story.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 8 — Earnings Calculator
            Purpose: Let sellers estimate potential revenue, reducing hesitation
            Ethiopian consideration: ETB currency, realistic local pricing ranges
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="calc-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Revenue Potential</p>
            <h2 id="calc-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              How Much Can You Earn?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Use our earnings calculator to see your potential monthly and yearly income. Adjust the numbers to match your business.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 md:p-10">
            <EarningsCalculator />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 9 — Seller Protection
            Purpose: Address fear of fraud, chargebacks, and disputes
            Ethiopian consideration: Trust is critical for online commerce adoption
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 rounded-3xl bg-brand-ivory dark:bg-card -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" aria-labelledby="protection-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Your Safety</p>
            <h2 id="protection-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Seller Protection Guarantee
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              We protect your business with industry-leading seller safeguards. Sell with confidence knowing every transaction is covered.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ICONS.shield, title: 'Payment Protection', desc: 'Funds are held securely until the buyer confirms delivery. No chargebacks from fraudulent buyers.' },
              { icon: ICONS.cash, title: 'Rental Deposits', desc: 'Every rental collects a security deposit from the buyer. If items are damaged, you file a claim and get compensated.' },
              { icon: ICONS.chat, title: 'Dispute Resolution', desc: 'Our trained team reviews evidence from both sides. Fair outcomes backed by documented chat, photos, and order details.' },
              { icon: ICONS.heart, title: 'Seller Guarantee', desc: 'Verified sellers in good standing are covered against fraudulent claims up to 50,000 ETB per incident.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon path={item.icon} />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 10 — Verification Process
            Purpose: Show how verification builds trust and increases sales
            Ethiopian consideration: Kebele ID, trade license familiarity
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="verify-heading">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Trust & Credibility</p>
              <h2 id="verify-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Get Verified, Sell More
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Verified sellers get 3× more orders than unverified sellers. The verification badge tells buyers you&apos;re trustworthy and committed to quality.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { step: '1', title: 'Confirm Your Email & Phone', desc: 'We send a verification code to your email and phone number. Takes 30 seconds.' },
                  { step: '2', title: 'Submit Your ID', desc: 'Upload a government-issued ID (Kebele ID, passport, or driver\'s license). Business sellers can also upload their trade license.' },
                  { step: '3', title: 'Get Your Blue Badge', desc: 'Our team reviews your documents within 24 hours. Once approved, your blue verified badge appears on all your listings and profile.' },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{s.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badge visual */}
            <div className="rounded-2xl border bg-card p-8 text-center shadow-lg">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Verified Seller Badge</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your mark of trust that buyers look for</p>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-2xl font-bold text-primary">3×</p>
                  <p className="text-xs text-muted-foreground">More orders</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-2xl font-bold text-primary">24h</p>
                  <p className="text-xs text-muted-foreground">Review time</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-2xl font-bold text-primary">↑</p>
                  <p className="text-xs text-muted-foreground">Higher ranking</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 11 — FAQ
            Purpose: Address common objections and questions
            Ethiopian consideration: Local payment methods, business registration
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24" aria-labelledby="faq-heading">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Questions?</p>
            <h2 id="faq-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about selling on Habesha Market. Can&apos;t find your answer? <Link href="/dashboard/messages" className="text-primary font-medium hover:text-primary/80">Contact our team</Link>.
            </p>
          </div>

          <SellerFAQ />
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 12 — Final CTA
            Purpose: Final conversion push with urgency and trust
            Ethiopian consideration: Community belonging, growth narrative
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-brand-gold p-8 md:p-16 text-center relative overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl max-w-3xl mx-auto leading-tight">
                Your Craft Deserves a Bigger Stage
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Join 2,000+ Ethiopian fashion sellers who are building thriving businesses on Habesha Market. Start today — it&apos;s free, fast, and designed for you.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register?role=seller"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
                >
                  Create Free Seller Account
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
                <Link
                  href="/dashboard/seller"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  View Seller Dashboard
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/70">
                <span className="flex items-center gap-2">
                  <Icon path={ICONS.check} className="h-4 w-4" /> No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Icon path={ICONS.check} className="h-4 w-4" /> Set up in under 5 minutes
                </span>
                <span className="flex items-center gap-2">
                  <Icon path={ICONS.check} className="h-4 w-4" /> Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </>
  )
}

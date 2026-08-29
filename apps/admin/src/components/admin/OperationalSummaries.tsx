"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import {
  Tag,
  Users,
  Store,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import type {
  ListingOperationalSummary,
  UserSellerSummary,
  OrdersOperationalSummary,
  RentalsOperationalSummary,
  CustomOrdersOperationalSummary,
} from '../../lib/adminApi'

interface OperationalSummariesProps {
  listings?: ListingOperationalSummary | undefined
  userSeller?: UserSellerSummary | undefined
  orders?: OrdersOperationalSummary | undefined
  rentals?: RentalsOperationalSummary | undefined
  customOrders?: CustomOrdersOperationalSummary | undefined
  isLoading?: boolean | undefined
}

export default function OperationalSummaries({
  listings,
  userSeller,
  orders,
  rentals,
  customOrders,
  isLoading = false,
}: OperationalSummariesProps) {
  const [activeTxTab, setActiveTxTab] = useState<'orders' | 'rentals' | 'customOrders'>('orders')

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 1. LISTING OVERVIEW CARD */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Listings Overview</h3>
                <p className="text-xs text-muted-foreground">Catalog status breakdown</p>
              </div>
            </div>
            <Link
              href="/listings"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link
              href="/listings?status=pending_review"
              className="group rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 transition hover:border-amber-500"
            >
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Pending Review</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{listings?.pending ?? 0}</p>
            </Link>

            <Link
              href="/listings?status=active"
              className="group rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 transition hover:border-emerald-500"
            >
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Active Listings</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{listings?.active ?? 0}</p>
            </Link>

            <Link
              href="/listings?status=rejected"
              className="group rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3 transition hover:border-rose-500"
            >
              <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Rejected</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{listings?.rejected ?? 0}</p>
            </Link>

            <Link
              href="/listings?status=draft"
              className="group rounded-2xl border border-border bg-background p-3 transition hover:border-primary/40"
            >
              <p className="text-xs font-medium text-muted-foreground">Draft / Inactive</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {(listings?.draft ?? 0) + (listings?.expired ?? 0) + (listings?.archived ?? 0)}
              </p>
            </Link>
          </div>
        </div>

        {/* Visual Bar */}
        {listings && listings.total > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-border/50">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                style={{ width: `${(listings.active / listings.total) * 100}%` }}
                className="bg-emerald-500"
                title="Active"
              />
              <div
                style={{ width: `${(listings.pending / listings.total) * 100}%` }}
                className="bg-amber-500"
                title="Pending"
              />
              <div
                style={{ width: `${(listings.rejected / listings.total) * 100}%` }}
                className="bg-rose-500"
                title="Rejected"
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-right font-mono">
              Total {listings.total.toLocaleString()} listings in database
            </p>
          </div>
        )}
      </div>

      {/* 2. USER & SELLER ACTIVITY CARD */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Users & Sellers</h3>
                <p className="text-xs text-muted-foreground">Account status breakdown</p>
              </div>
            </div>
            <Link
              href="/admin/users-verification"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Manage
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-background border border-border">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Total Registered Users
              </span>
              <span className="text-sm font-bold text-foreground">
                {userSeller?.totalUsers.toLocaleString() ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-background border border-border">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-purple-500" />
                Active Marketplace Sellers
              </span>
              <span className="text-sm font-bold text-foreground">
                {userSeller?.activeSellers.toLocaleString() ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                Suspended / Banned Users
              </span>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                {userSeller?.suspendedUsers ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>+{userSeller?.newUsersPeriod ?? 0} new users in range</span>
          <Link
            href="/admin/users-verification?tab=verification"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {userSeller?.pendingVerifications ?? 0} pending verifications
          </Link>
        </div>
      </div>

      {/* 3. ORDERS / RENTALS / CUSTOM ORDERS SUMMARY CARD */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Transactions Summary</h3>
                <p className="text-xs text-muted-foreground">Sales, rentals & custom orders</p>
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex rounded-2xl bg-muted/50 p-1 border border-border mb-4">
            <button
              type="button"
              onClick={() => setActiveTxTab('orders')}
              className={`flex-1 rounded-xl py-1 text-xs font-semibold transition ${
                activeTxTab === 'orders'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Orders ({orders?.total ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTxTab('rentals')}
              className={`flex-1 rounded-xl py-1 text-xs font-semibold transition ${
                activeTxTab === 'rentals'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Rentals ({rentals?.total ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTxTab('customOrders')}
              className={`flex-1 rounded-xl py-1 text-xs font-semibold transition ${
                activeTxTab === 'customOrders'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Custom ({customOrders?.total ?? 0})
            </button>
          </div>

          {/* Tab 1: Direct Sale Orders */}
          {activeTxTab === 'orders' && (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/listings?tab=orders&status=INQUIRY_PENDING"
                className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 transition"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">New Inquiries</p>
                <p className="mt-1 text-xl font-bold text-foreground">{orders?.new ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=orders&status=active"
                className="p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:border-blue-500 transition"
              >
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">In Progress</p>
                <p className="mt-1 text-xl font-bold text-foreground">{orders?.active ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=orders&status=COMPLETED"
                className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 transition"
              >
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Completed</p>
                <p className="mt-1 text-xl font-bold text-foreground">{orders?.completed ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=orders&status=CANCELLED"
                className="p-3 rounded-2xl border border-border bg-background hover:border-primary/40 transition"
              >
                <p className="text-xs text-muted-foreground font-medium">Cancelled</p>
                <p className="mt-1 text-xl font-bold text-foreground">{orders?.cancelled ?? 0}</p>
              </Link>
            </div>
          )}

          {/* Tab 2: Rental Orders */}
          {activeTxTab === 'rentals' && (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/listings?tab=rentals&status=REQUESTED"
                className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 transition"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Upcoming / Req</p>
                <p className="mt-1 text-xl font-bold text-foreground">{rentals?.upcoming ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=rentals&status=ACTIVE"
                className="p-3 rounded-2xl border border-sky-500/30 bg-sky-500/5 hover:border-sky-500 transition"
              >
                <p className="text-xs text-sky-700 dark:text-sky-400 font-medium">Active Rentals</p>
                <p className="mt-1 text-xl font-bold text-foreground">{rentals?.active ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=rentals&status=RETURN_INITIATED"
                className="p-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:border-purple-500 transition"
              >
                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">Returning</p>
                <p className="mt-1 text-xl font-bold text-foreground">{rentals?.returningOverdue ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=rentals&status=DISPUTED"
                className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:border-rose-500 transition"
              >
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Disputed</p>
                <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                  {rentals?.disputed ?? 0}
                </p>
              </Link>
            </div>
          )}

          {/* Tab 3: Custom Design Orders */}
          {activeTxTab === 'customOrders' && (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/listings?tab=custom_orders&status=submitted"
                className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 transition"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">New Requests</p>
                <p className="mt-1 text-xl font-bold text-foreground">{customOrders?.newRequests ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=custom_orders&status=in_production"
                className="p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500 transition"
              >
                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">In Production</p>
                <p className="mt-1 text-xl font-bold text-foreground">{customOrders?.inProgress ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=custom_orders&status=under_review"
                className="p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:border-blue-500 transition"
              >
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Awaiting Action</p>
                <p className="mt-1 text-xl font-bold text-foreground">{customOrders?.awaitingAction ?? 0}</p>
              </Link>
              <Link
                href="/listings?tab=custom_orders&status=delivered"
                className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 transition"
              >
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Delivered</p>
                <p className="mt-1 text-xl font-bold text-foreground">{customOrders?.completed ?? 0}</p>
              </Link>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border/50 text-right">
          <Link
            href="/listings"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Open Order Center
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

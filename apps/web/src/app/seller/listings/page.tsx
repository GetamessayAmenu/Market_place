'use client';

import React, { useState, Suspense } from 'react';
import { Badge, Button, Card, CardContent, Input } from '@marketplace/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';
import { useMyListings } from '../../../hooks/useSeller';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blackoutDateSchema, type BlackoutDateInput } from '../../../lib/validations/seller';
import { useBlackoutDates, useAddBlackoutDate, useDeleteBlackoutDate } from '../../../hooks/seller/useBlackoutDates';

// ─── Types ─────────────────────────────────────────────────────────────────

type BusinessModel = 'ready-made' | 'rental' | 'custom';

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  status: string;
  stockStatus: 'in_stock' | 'rented_out' | 'out_of_stock';
  rejectedReason?: string | null;
  businessModels: BusinessModel[];
  views: number;
  inquiries: number;
  createdAt: string;
  customAvailable?: boolean;
  rentalAvailable?: boolean;
  city?: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconEdit = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const IconEye = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// ─── Badges ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Live / Approved', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    changes_requested: { label: 'Changes Requested', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
    paused: { label: 'Paused', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    sold: { label: 'Sold', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    rented: { label: 'Rented', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  const item = config[status] || { label: status?.replace('_', ' '), className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <Badge className={item.className} variant="outline">
      {item.label}
    </Badge>
  );
}

function BusinessModelBadges({ models }: { models?: BusinessModel[] }) {
  const config = {
    'ready-made': { label: 'Sale', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    'rental': { label: 'Rental', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    'custom': { label: 'Custom Available', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  if (!Array.isArray(models) || models.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {models.map((model) => {
        const item = config[model];
        if (!item) return null;
        return (
          <Badge key={model} className={item.className} variant="outline">
            {item.label}
          </Badge>
        );
      })}
    </div>
  );
}

// ─── Sub-Component: Blackout Calendar ────────────────────────────────────────

function BlackoutCalendarSection({ sellerId }: { sellerId: string }) {
  const { data: blackoutDates = [], isLoading } = useBlackoutDates(sellerId);
  const addMutation = useAddBlackoutDate();
  const deleteMutation = useDeleteBlackoutDate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BlackoutDateInput>({
    resolver: zodResolver(blackoutDateSchema),
  });

  const onSubmit = (data: BlackoutDateInput) => {
    addMutation.mutate(data, {
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="space-y-6">
      <Card id="calendar">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconCalendar />
            </div>
            <div>
              <h3 className="text-base font-semibold">Rental Blackout Dates</h3>
              <p className="text-xs text-muted-foreground">
                Block periods when your rental garments are undergoing dry cleaning, tailoring repairs, or are reserved offline.
              </p>
            </div>
          </div>

          {/* Add Date Period Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule Unavailable Range</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.startDate && <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">End Date</label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.endDate && <p className="text-destructive text-xs mt-1">{errors.endDate.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Reason / Purpose</label>
                <input
                  placeholder="e.g. Dry Cleaning / Maintenance"
                  {...register('reason')}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason.message}</p>}
              </div>
            </div>
            <Button type="submit" disabled={addMutation.isPending} size="sm" className="gap-1.5">
              <IconPlus />
              {addMutation.isPending ? 'Blocking Dates...' : 'Block Date Range'}
            </Button>
          </form>

          {/* Existing Blackout Dates List */}
          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Blackout Dates</h4>
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-2">Loading blackout schedule...</p>
            ) : blackoutDates.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                No blackout dates scheduled. Your rental items are open for buyer bookings on normal business days.
              </div>
            ) : (
              <div className="divide-y border rounded-lg overflow-hidden">
                {blackoutDates.map((date) => (
                  <div key={date.id} className="flex items-center justify-between p-3.5 bg-card hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{date.reason || 'Reserved / Maintenance'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {date.startDate} → {date.endDate}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive text-xs hover:bg-destructive/10"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(date.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Traditional Fabric Presets Guide */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-1">Ethiopian Textile Presets Reference</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Common garment fabric tags used by Ethiopian weavers and tailors on Habesha Market:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { name: 'Menen (መነን)', desc: 'Lightweight woven cotton' },
              { name: 'Saba (ሳባ)', desc: 'Geometric pattern textile' },
              { name: 'Tilf (ጥልፍ)', desc: 'Artisanal embroidery threadwork' },
              { name: 'Shema (ሸማ)', desc: 'Handwoven traditional cotton' },
              { name: 'Netela (ነጠላ)', desc: 'Double-layered scarf / wrap' },
              { name: 'Gabi (ጋቢ)', desc: 'Heavy warm 4-layer cotton wrap' },
              { name: 'Kutna (ኩትና)', desc: 'Soft handloom cotton weave' },
              { name: 'Chiffon Kemis', desc: 'Flowing modern dress styling' },
            ].map((f) => (
              <div key={f.name} className="p-2.5 rounded-lg border bg-muted/20">
                <p className="font-semibold text-xs text-foreground">{f.name}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Listings Component ────────────────────────────────────────────────

function ListingsContent() {
  const user = useAuth((s) => s.user);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'calendar' ? 'calendar' : 'listings';

  const [activeMainTab, setActiveMainTab] = useState<'listings' | 'calendar'>(initialTab);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: listingsRes, isLoading } = useMyListings(user?.id ?? '');

  const rawItems: any[] = Array.isArray(listingsRes)
    ? listingsRes
    : Array.isArray(listingsRes?.data)
    ? listingsRes.data
    : Array.isArray((listingsRes as any)?.data?.data)
    ? (listingsRes as any).data.data
    : Array.isArray((listingsRes as any)?.items)
    ? (listingsRes as any).items
    : [];

  const listings: Listing[] = rawItems.map((l: any) => {
    const businessModels: BusinessModel[] = [];
    if (l.availableForPurchase) businessModels.push('ready-made');
    if (l.availableForRent) businessModels.push('rental');
    if (l.customOrderAvailable) businessModels.push('custom');
    if (businessModels.length === 0) businessModels.push('ready-made');

    return {
      id: l.id,
      title: l.title,
      price: typeof l.price === 'string' ? parseFloat(l.price) : Number(l.price || 0),
      currency: l.currency || 'ETB',
      imageUrl: l.primaryImageUrl || l.images?.[0]?.url,
      status: l.status || 'pending_review',
      stockStatus: l.status === 'sold' ? 'out_of_stock' : l.status === 'rented' ? 'rented_out' : 'in_stock',
      rejectedReason: l.rejectedReason,
      businessModels,
      views: l.viewCount ?? 0,
      inquiries: 0,
      createdAt: l.createdAt,
      customAvailable: l.customOrderAvailable,
      rentalAvailable: l.availableForRent,
      city: l.city,
    };
  });

  const tabCounts: Record<string, number> = {
    all: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    pending_review: listings.filter((l) => l.status === 'pending_review' || l.status === 'pending').length,
    changes_requested: listings.filter((l) => l.status === 'changes_requested').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
    sold: listings.filter((l) => l.status === 'sold' || l.status === 'rented').length,
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = searchQuery === '' || listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_review') {
        matchesStatus = listing.status === 'pending_review' || listing.status === 'pending';
      } else if (statusFilter === 'sold') {
        matchesStatus = listing.status === 'sold' || listing.status === 'rented';
      } else {
        matchesStatus = listing.status === statusFilter;
      }
    }

    let matchesModel = true;
    if (modelFilter !== 'all') {
      matchesModel = listing.businessModels.includes(modelFilter as BusinessModel);
    }

    return matchesSearch && matchesStatus && matchesModel;
  });

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Please log in to manage your listings.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Listings & Stock Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Ethiopian fashion catalog, stock availability, and rental calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/seller/catalog/new">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <IconPlus />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Main Tab Switcher ────────────────────────────────────────────────── */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveMainTab('listings')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeMainTab === 'listings'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveMainTab('calendar')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
            activeMainTab === 'calendar'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <IconCalendar />
          Rental Calendar & Stock
        </button>
      </div>

      {/* ── Tab Content: All Listings ────────────────────────────────────────── */}
      {activeMainTab === 'listings' && (
        <div className="space-y-5">
          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Live / Approved' },
              { id: 'pending_review', label: 'Pending Review' },
              { id: 'changes_requested', label: 'Changes Requested' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'sold', label: 'Sold / Rented' },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              const count = tabCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label}
                  <span className={`text-2xs rounded-full px-1.5 py-0.2 ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/80 text-muted-foreground'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Model Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search listing title or city..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm w-full sm:w-48"
            >
              <option value="all">All Models</option>
              <option value="ready-made">Sale Only</option>
              <option value="rental">Rentals</option>
              <option value="custom">Custom-Made Available</option>
            </select>
          </div>

          {/* Listings List */}
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                Loading your listings catalog...
              </CardContent>
            </Card>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm font-medium text-foreground">No listings match your search or filter.</p>
                <p className="text-xs text-muted-foreground mt-1">Try selecting another status tab or add a new listing to your shop.</p>
                <Link href="/seller/catalog/new" className="mt-4 inline-block">
                  <Button size="sm" className="gap-1.5">
                    <IconPlus />
                    Add New Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      {/* Left: Thumbnail & Details */}
                      <div className="flex gap-3.5 items-start min-w-0 flex-1">
                        <Link href={`/products/${listing.id}`} className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 block border">
                          {listing.imageUrl ? (
                            <img
                              src={listing.imageUrl}
                              alt={listing.title}
                              className="h-full w-full object-cover hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-2xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/products/${listing.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate">
                              {listing.title}
                            </Link>
                            <StatusBadge status={listing.status} />
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-sm font-bold text-primary">
                              {listing.currency} {listing.price.toLocaleString()}
                            </span>
                            <BusinessModelBadges models={listing.businessModels} />
                            {listing.city && (
                              <span className="text-xs text-muted-foreground">📍 {listing.city}</span>
                            )}
                          </div>

                          {/* Rejection / Changes feedback alert */}
                          {(listing.status === 'rejected' || listing.status === 'changes_requested') && (
                            <div className="mt-2 p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20 dark:border-red-900/40 text-xs">
                              <p className="font-semibold text-red-800 dark:text-red-300">
                                {listing.status === 'rejected' ? 'Rejection Reason' : 'Changes Requested by Moderator'}:
                              </p>
                              <p className="mt-0.5 text-muted-foreground">{listing.rejectedReason || 'Please review moderation guidelines and update your listing details.'}</p>
                              <Link
                                href={`/seller/catalog/${listing.id}/edit`}
                                className="inline-block mt-1.5 font-semibold text-primary hover:underline"
                              >
                                Edit & Resubmit Listing →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <Link href={`/products/${listing.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <IconEye />
                            View
                          </Button>
                        </Link>
                        <Link href={`/seller/catalog/${listing.id}/edit`}>
                          <Button size="sm" className="gap-1 text-xs">
                            <IconEdit />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Rental Calendar & Stock ─────────────────────────────── */}
      {activeMainTab === 'calendar' && (
        <BlackoutCalendarSection sellerId={user.id} />
      )}
    </div>
  );
}

export default function ListingsManagementPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading listings hub...</div>}>
      <ListingsContent />
    </Suspense>
  );
}

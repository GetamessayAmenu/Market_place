'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@marketplace/ui';
import Link from 'next/link';
import useAuth from '../../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blackoutDateSchema, type BlackoutDateInput } from '../../../lib/validations/seller';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  title: string;
  price: number;
  status: 'in_stock' | 'rented_out' | 'out_of_stock';
  businessModels: ('sale' | 'rental' | 'custom')[];
  primaryImageUrl?: string;
  city?: string;
  condition: string;
}

interface BlackoutDate {
  startDate: string;
  endDate: string;
  reason: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconEdit = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function StockStatusBadge({ status }: { status: Listing['status'] }) {
  const variants = {
    in_stock: { variant: 'success' as const, label: 'In Stock' },
    rented_out: { variant: 'warning' as const, label: 'Rented Out' },
    out_of_stock: { variant: 'error' as const, label: 'Out of Stock' },
  };
  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function BusinessModelBadges({ models }: { models: Listing['businessModels'] }) {
  const colors = {
    sale: 'bg-blue-100 text-blue-700',
    rental: 'bg-purple-100 text-purple-700',
    custom: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {models.map((model) => (
        <span key={model} className={`px-2 py-0.5 rounded text-xs font-medium ${colors[model]}`}>
          {model === 'sale' ? 'Sale' : model === 'rental' ? 'Rent' : 'Custom'}
        </span>
      ))}
    </div>
  );
}

function BlackoutCalendar() {
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([
    { startDate: '2026-08-15', endDate: '2026-08-20', reason: 'Shop maintenance' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BlackoutDateInput>({
    resolver: zodResolver(blackoutDateSchema),
  });

  const addBlackoutDate = (data: BlackoutDateInput) => {
    setBlackoutDates([...blackoutDates, data]);
    reset();
  };

  const removeBlackoutDate = (index: number) => {
    setBlackoutDates(blackoutDates.filter((_, i) => i !== index));
  };

  return (
    <Card id="calendar">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <IconCalendar />
          Blackout Calendar
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Block dates when items are unavailable for rental (cleaning, repairs, shop closure).
        </p>

        {/* Add New Blackout Date */}
        <form onSubmit={handleSubmit(addBlackoutDate)} className="space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.startDate && <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.endDate && <p className="text-destructive text-xs mt-1">{errors.endDate.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <input
                placeholder="e.g., Shop maintenance"
                {...register('reason')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason.message}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <IconPlus />
            Add Blackout Period
          </Button>
        </form>

        {/* Existing Blackout Dates */}
        <div className="space-y-2">
          {blackoutDates.map((date, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">{date.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {date.startDate} → {date.endDate}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeBlackoutDate(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const user = useAuth((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'rented_out' | 'out_of_stock'>('all');

  // Mock data - TODO: Replace with actual API calls using useMyListings hook
  const listings: Listing[] = [
    {
      id: '1',
      title: 'Traditional Habesha Kemis with Tilf Embroidery',
      price: 3500,
      status: 'in_stock',
      businessModels: ['sale', 'custom'],
      city: 'Addis Ababa',
      condition: 'new',
    },
    {
      id: '2',
      title: 'Ethiopian Gabi - White Cotton',
      price: 800,
      status: 'rented_out',
      businessModels: ['sale', 'rental'],
      city: 'Addis Ababa',
      condition: 'excellent',
    },
    {
      id: '3',
      title: 'Modern Dress with Ethiopian Patterns',
      price: 1200,
      status: 'in_stock',
      businessModels: ['sale'],
      city: 'Bole',
      condition: 'new',
    },
    {
      id: '4',
      title: 'Custom Netela - Handwoven',
      price: 450,
      status: 'out_of_stock',
      businessModels: ['sale', 'custom'],
      city: 'Shiro Meda',
      condition: 'good',
    },
  ];

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to manage your catalog.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Catalog & Stock Manager</h1>
          <p className="text-muted-foreground">Manage your listings, inventory, and rental availability.</p>
        </div>
        <Link href="/seller/catalog/new">
          <Button>
            <IconPlus />
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Blackout Calendar */}
      <BlackoutCalendar />

      {/* Stock Quick-Edit Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Stock Quick-Edit</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
                className="w-40 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="rented_out">Rented Out</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Business Models</TableHead>
                <TableHead>Price (ETB)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">{listing.city}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <BusinessModelBadges models={listing.businessModels} />
                  </TableCell>
                  <TableCell className="font-medium">{listing.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <StockStatusBadge status={listing.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/seller/catalog/${listing.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <IconEdit />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredListings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No listings found. Create your first listing to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fabric Presets & Tags */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Traditional Fabric Presets</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Quick-select traditional Ethiopian fabric attributes for your listings.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Menen', 'Saba', 'Tilf Embroidery', 'Kutna', 'Netela', 'Gabi', 'Shema'].map((fabric) => (
              <button
                key={fabric}
                type="button"
                className="px-3 py-1.5 rounded-full border border-border hover:bg-muted text-sm"
              >
                {fabric}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

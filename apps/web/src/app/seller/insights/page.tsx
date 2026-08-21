'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { apiGet } from '../../../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewResponseSchema, type ReviewResponseInput } from '../../../lib/validations/seller';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}

interface DepositLog {
  id: string;
  type: 'held' | 'refunded';
  amount: number;
  customerName: string;
  relatedOrder: string;
  date: string;
  notes?: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  listing?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalOrders: number;
  lastOrderDate: string;
  storedMeasurements?: Record<string, number>;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconEye = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconStar = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.75 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function AnalyticsMetricCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            {metric.icon}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
          <div className={`text-xs font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metric.change >= 0 ? '+' : ''}{metric.change}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DepositLogTable({ deposits }: { deposits: DepositLog[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Amount (ETB)</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deposits.map((deposit) => (
          <TableRow key={deposit.id}>
            <TableCell className="text-sm">{deposit.date}</TableCell>
            <TableCell>
              <Badge variant={deposit.type === 'held' ? 'warning' : 'success'}>
                {deposit.type === 'held' ? 'Held' : 'Refunded'}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{deposit.customerName}</TableCell>
            <TableCell className="text-sm font-medium">{deposit.amount.toLocaleString()}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{deposit.relatedOrder}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{deposit.notes || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewResponseInput>({
    resolver: zodResolver(reviewResponseSchema),
  });

  const handleSubmitResponse = (data: ReviewResponseInput) => {
    console.log('Review response:', data);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium text-sm">{review.customerName}</p>
            {review.listing && (
              <p className="text-xs text-muted-foreground">{review.listing}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconStar />
            <span className="text-sm font-medium">{review.rating}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{review.comment}</p>
        <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
        <form onSubmit={handleSubmit(handleSubmitResponse)} className="mt-3 space-y-2">
          <textarea
            placeholder="Respond to this review..."
            {...register('response')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"
          />
          {errors.response && <p className="text-destructive text-xs">{errors.response.message}</p>}
          <Button type="submit" size="sm" variant="outline" className="w-full">
            Post Response
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{customer.name}</p>
          {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
        </div>
      </TableCell>
      <TableCell className="text-sm">{customer.totalOrders}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{customer.lastOrderDate}</TableCell>
      <TableCell>
        {customer.storedMeasurements ? (
          <Badge variant="outline" className="text-xs">On File</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">View</Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const user = useAuth((s) => s.user);
  const [activeTab, setActiveTab] = useState<'analytics' | 'deposits' | 'reviews' | 'customers'>('analytics');
  const [followerCount, setFollowerCount] = useState(0);

  // Fetch followers count
  React.useEffect(() => {
    if (user?.id) {
      apiGet<{ _count: { storeFollowers: number } }>(`/users/${user.id}`)
        .then((data) => {
          setFollowerCount(data._count?.storeFollowers || 0);
        })
        .catch(() => {
          setFollowerCount(0);
        });
    }
  }, [user?.id]);

  // Mock data - replace with actual API calls
  const analyticsMetrics: AnalyticsMetric[] = [
    {
      label: 'Listing Views',
      value: 1247,
      change: 23,
      icon: <IconEye />,
    },
    {
      label: 'Chat Starts',
      value: 89,
      change: 15,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>,
    },
    {
      label: 'WhatsApp Clicks',
      value: 156,
      change: 31,
      icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>,
    },
    {
      label: 'Phone Reveals',
      value: 67,
      change: 12,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>,
    },
    {
      label: 'Followers',
      value: followerCount,
      change: 0,
      icon: <IconUsers />,
    },
  ];

  const depositLogs: DepositLog[] = [
    {
      id: '1',
      type: 'held',
      amount: 500,
      customerName: 'Tigist Haile',
      relatedOrder: 'Gabi Rental #456',
      date: '2026-07-28',
      notes: 'Security deposit for 3-day rental',
    },
    {
      id: '2',
      type: 'refunded',
      amount: 400,
      customerName: 'Abebe Kebede',
      relatedOrder: 'Kemis Order #123',
      date: '2026-07-25',
      notes: 'Item returned in good condition',
    },
    {
      id: '3',
      type: 'held',
      amount: 600,
      customerName: 'Dawit Abebe',
      relatedOrder: 'Netela Rental #789',
      date: '2026-07-20',
      notes: 'Security deposit for weekend rental',
    },
  ];

  const reviews: Review[] = [
    {
      id: '1',
      customerName: 'Sara Tekle',
      rating: 5,
      comment: 'Beautiful craftsmanship! The Habesha Kemis exceeded my expectations. Will definitely order again.',
      date: '2026-07-27',
      listing: 'Traditional Habesha Kemis',
    },
    {
      id: '2',
      customerName: 'Mekonnen Bekele',
      rating: 4,
      comment: 'Great quality and fast service. The Gabi was clean and well-maintained.',
      date: '2026-07-25',
      listing: 'Ethiopian Gabi',
    },
    {
      id: '3',
      customerName: 'Almaz Tadesse',
      rating: 5,
      comment: 'Perfect fit for the wedding! The custom measurements were spot on.',
      date: '2026-07-22',
      listing: 'Custom Netela',
    },
  ];

  const customers: Customer[] = [
    {
      id: '1',
      name: 'Sara Tekle',
      email: 'sara@email.com',
      totalOrders: 3,
      lastOrderDate: '2026-07-27',
      storedMeasurements: { bust: 36, waist: 28, hips: 38 },
    },
    {
      id: '2',
      name: 'Abebe Kebede',
      phone: '+251911234567',
      totalOrders: 2,
      lastOrderDate: '2026-07-25',
    },
    {
      id: '3',
      name: 'Tigist Haile',
      email: 'tigist@email.com',
      totalOrders: 1,
      lastOrderDate: '2026-07-28',
      storedMeasurements: { bust: 34, waist: 26, hips: 36 },
    },
  ];

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your insights.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Insights & Customer Feedback</h1>
        <p className="text-muted-foreground">Track your performance, manage deposits, and respond to reviews.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['analytics', 'deposits', 'reviews', 'customers'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {analyticsMetrics.map((metric, index) => (
              <AnalyticsMetricCard key={index} metric={metric} />
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Overview</h3>
              <p className="text-sm text-muted-foreground">
                Your listings are performing well! Consider adding more items during the upcoming holiday season to maximize visibility.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Manual Offline Deposit Log</h3>
                <Button variant="outline">Add Entry</Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Track security deposits held for rentals and refunds processed offline.
              </p>
              <DepositLogTable deposits={depositLogs} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <IconUsers />
                  Customer Directory
                </h3>
                <Input placeholder="Search customers..." className="w-64" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Measurements</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <CustomerRow key={customer.id} customer={customer} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

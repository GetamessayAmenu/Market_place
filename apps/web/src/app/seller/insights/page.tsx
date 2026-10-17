'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { apiGet } from '../../../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewResponseSchema, type ReviewResponseInput } from '../../../lib/validations/seller';
import { 
  useAnalytics, 
  useDeposits, 
  useAddDeposit, 
  useSellerReviews, 
  useRespondToReview, 
  useCustomers,
  type ReviewItem
} from '../../../hooks/seller/useAnalytics';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconEye = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconChat = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconWhatsApp = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const IconPhone = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const IconStar = () => (
  <svg className="h-4 w-4 text-amber-500 fill-amber-400" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewItem }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const respondMutation = useRespondToReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewResponseInput>({
    resolver: zodResolver(reviewResponseSchema),
  });

  const onSubmitResponse = (data: ReviewResponseInput) => {
    respondMutation.mutate(
      { reviewId: review.id, response: data.response },
      {
        onSuccess: () => {
          setShowReplyForm(false);
          reset();
        },
      }
    );
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm text-foreground">{review.customerName}</p>
            {review.listing && (
              <p className="text-2xs text-muted-foreground truncate max-w-xs">{review.listing}</p>
            )}
          </div>
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded text-xs font-semibold text-amber-700 dark:text-amber-300">
            <IconStar />
            <span>{review.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed">{review.comment}</p>
        <p className="text-3xs text-muted-foreground">{review.date}</p>

        {review.response ? (
          <div className="mt-2.5 p-2.5 rounded-lg bg-muted/60 border text-xs">
            <p className="font-semibold text-2xs text-primary mb-0.5">Your Response:</p>
            <p className="text-muted-foreground">{review.response}</p>
          </div>
        ) : (
          <div>
            {!showReplyForm ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs px-2 py-1 h-auto text-primary"
                onClick={() => setShowReplyForm(true)}
              >
                Reply to review
              </Button>
            ) : (
              <form onSubmit={handleSubmit(onSubmitResponse)} className="mt-2 space-y-2">
                <textarea
                  placeholder="Thank the customer or address their feedback..."
                  {...register('response')}
                  className="w-full rounded-md border bg-background p-2 text-xs min-h-[50px]"
                />
                {errors.response && <p className="text-destructive text-3xs">{errors.response.message}</p>}
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="text-xs"
                    disabled={respondMutation.isPending}
                  >
                    {respondMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const user = useAuth((s) => s.user);
  const sellerId = user?.id || '';

  const [activeTab, setActiveTab] = useState<'analytics' | 'deposits' | 'reviews' | 'customers'>('analytics');
  const [period, setPeriod] = useState<string>('30d');
  const [customerSearch, setCustomerSearch] = useState('');
  const [followerCount, setFollowerCount] = useState(0);
  const [showAddDepositModal, setShowAddDepositModal] = useState(false);

  // Deposit Form State
  const [depositType, setDepositType] = useState<'held' | 'refunded'>('held');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCustomer, setDepositCustomer] = useState('');
  const [depositOrder, setDepositOrder] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  // Real backend queries
  const { data: analytics, isLoading: isLoadingAnalytics } = useAnalytics(sellerId, period);
  const { data: deposits = [], isLoading: isLoadingDeposits } = useDeposits(sellerId);
  const { data: reviewsData, isLoading: isLoadingReviews } = useSellerReviews(sellerId);
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers(sellerId);
  const addDepositMutation = useAddDeposit();

  // Fetch followers count
  useEffect(() => {
    if (sellerId) {
      apiGet<{ _count: { storeFollowers: number } }>(`/users/${sellerId}`)
        .then((data) => {
          setFollowerCount(data._count?.storeFollowers || 0);
        })
        .catch(() => {
          setFollowerCount(0);
        });
    }
  }, [sellerId]);

  if (!user) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Please log in to view your store insights.
      </div>
    );
  }

  const handleCreateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !depositCustomer) return;
    addDepositMutation.mutate(
      {
        type: depositType,
        amount: parseFloat(depositAmount),
        customerName: depositCustomer,
        relatedOrder: depositOrder || undefined,
        notes: depositNotes || undefined,
      },
      {
        onSuccess: () => {
          setShowAddDepositModal(false);
          setDepositAmount('');
          setDepositCustomer('');
          setDepositOrder('');
          setDepositNotes('');
        },
      }
    );
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Insights & Customer Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track classified engagement, buyer inquiries, rental security deposits, and customer reviews.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { key: 'analytics', label: 'Inquiries & Analytics' },
          { key: 'deposits', label: 'Rental Deposits' },
          { key: 'reviews', label: `Reviews (${reviewsData?.totalReviews ?? 0})` },
          { key: 'customers', label: `Customers (${customers.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1. Analytics Tab ──────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Buyer Intent & Engagement</h2>
            <div className="flex gap-1.5 bg-muted p-1 rounded-lg">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    period === p ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <p className="text-xs font-medium">Listing Views</p>
                  <IconEye />
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingAnalytics ? '...' : (analytics?.listingViews ?? 0).toLocaleString()}
                </p>
                <p className="text-3xs text-muted-foreground mt-1">Total product page impressions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <p className="text-xs font-medium">Chat Starts</p>
                  <IconChat />
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingAnalytics ? '...' : (analytics?.chatStarts ?? 0).toLocaleString()}
                </p>
                <p className="text-3xs text-muted-foreground mt-1">Platform conversations started</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <p className="text-xs font-medium">WhatsApp Clicks</p>
                  <IconWhatsApp />
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingAnalytics ? '...' : (analytics?.whatsappClicks ?? 0).toLocaleString()}
                </p>
                <p className="text-3xs text-muted-foreground mt-1">Direct message triggers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <p className="text-xs font-medium">Phone Reveals</p>
                  <IconPhone />
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoadingAnalytics ? '...' : (analytics?.phoneReveals ?? 0).toLocaleString()}
                </p>
                <p className="text-3xs text-muted-foreground mt-1">Buyers viewing phone number</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <p className="text-xs font-medium">Store Followers</p>
                  <IconUsers />
                </div>
                <p className="text-2xl font-bold mt-2">{followerCount.toLocaleString()}</p>
                <p className="text-3xs text-muted-foreground mt-1">Buyers following your boutique</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-2">Classified Channel Insights</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Habesha Market is designed as a direct-connection marketplace. Inquiries occur via WhatsApp, platform chat, and direct calls. 
                High WhatsApp clicks and phone reveals indicate strong buyer intent for custom tailoring and rental bookings.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 2. Deposits Tab ──────────────────────────────────────────────── */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">Rental Security Deposit Ledger</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Log and track offline security deposits held for rental garments (cash, CBE, Telebirr) and record returns.
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowAddDepositModal(true)}>
                  + Log Deposit
                </Button>
              </div>

              {isLoadingDeposits ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading deposits...</p>
              ) : deposits.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No deposits currently logged.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When renting out items, you can record customer security deposits here to keep your offline accounts balanced.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount (ETB)</TableHead>
                      <TableHead>Order Ref</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="text-xs">{deposit.date}</TableCell>
                        <TableCell>
                          <Badge variant={deposit.type === 'held' ? 'warning' : 'success'} className="text-2xs">
                            {deposit.type === 'held' ? 'Held' : 'Refunded'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{deposit.customerName}</TableCell>
                        <TableCell className="text-xs font-semibold">{deposit.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{deposit.relatedOrder || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{deposit.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 3. Reviews Tab ───────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">Seller Feedback & Ratings</h2>
              {reviewsData && reviewsData.totalReviews > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md text-sm font-bold text-amber-700 dark:text-amber-300">
                  <IconStar />
                  <span>{reviewsData.averageRating.toFixed(1)} / 5.0</span>
                </div>
              )}
            </div>
          </div>

          {isLoadingReviews ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading reviews...</p>
          ) : !reviewsData || reviewsData.reviews.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <p className="text-sm font-medium">No reviews received yet.</p>
                <p className="text-xs mt-1">
                  Customer reviews and ratings for your completed purchases and rentals will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewsData.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Customers Tab ─────────────────────────────────────────────── */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold">Customer Directory</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Directory of buyers who have purchased, rented, requested custom tailoring, or chatted with you.
                  </p>
                </div>
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={customerSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerSearch(e.target.value)}
                  className="w-full sm:w-64"
                />
              </div>

              {isLoadingCustomers ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading customer directory...</p>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No customers found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Last Interaction</TableHead>
                      <TableHead>Measurements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <p className="font-medium text-xs text-foreground">{customer.name}</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {customer.phone || customer.email || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{customer.totalOrders}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{customer.lastOrderDate}</TableCell>
                        <TableCell>
                          {customer.storedMeasurements && Object.keys(customer.storedMeasurements).length > 0 ? (
                            <Badge variant="outline" className="text-2xs bg-primary/10 text-primary border-primary/20">
                              Measurements on File
                            </Badge>
                          ) : (
                            <span className="text-2xs text-muted-foreground">Standard</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Add Deposit Modal ────────────────────────────────────────────── */}
      {showAddDepositModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-base">Record Rental Security Deposit</h3>
              <button 
                onClick={() => setShowAddDepositModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeposit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium mb-1 block">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositType('held')}
                    className={`py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                      depositType === 'held' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'
                    }`}
                  >
                    Deposit Held
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositType('refunded')}
                    className={`py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                      depositType === 'refunded' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-muted/50'
                    }`}
                  >
                    Deposit Refunded
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Customer Name *</label>
                <input
                  required
                  placeholder="e.g., Sara Tekle"
                  value={depositCustomer}
                  onChange={(e) => setDepositCustomer(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Amount (ETB) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="50"
                  placeholder="e.g., 500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Order / Garment Reference (Optional)</label>
                <input
                  placeholder="e.g., Traditional Habesha Kemis Rental"
                  value={depositOrder}
                  onChange={(e) => setDepositOrder(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Notes / Method (Optional)</label>
                <input
                  placeholder="e.g., Received via CBE / Item returned in good condition"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddDepositModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={addDepositMutation.isPending}
                >
                  {addDepositMutation.isPending ? 'Saving...' : 'Save Deposit Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Alert, Input, Textarea } from '@marketplace/ui';
import { useAuth } from '../../../../../hooks/useAuth';
import { apiGet, apiPost } from '../../../../../lib/api';

type OrderType = 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING';

interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  agreedPrice: number;
  product: {
    title: string;
    currency: string;
    price: number;
  };
  buyer: {
    displayName: string;
  };
}

export default function CreateQuotePage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuth((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedDeposit, setProposedDeposit] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchOrder = async () => {
      try {
        const data = await apiGet<Order>(`/orders/${params.id}`);
        setOrder(data);
        setProposedPrice(data.agreedPrice.toString());
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [user, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiPost(`/orders/${order.id}/quotes`, {
        proposedPrice: parseFloat(proposedPrice),
        proposedDeposit: proposedDeposit ? parseFloat(proposedDeposit) : undefined,
        notes: notes || undefined,
      });

      router.push(`/dashboard/orders/${order.id}?success=quote`);
    } catch (err) {
      setError('Failed to create quote');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to create quotes</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse bg-muted h-6 w-48 mx-auto rounded mb-4" />
        <div className="animate-pulse bg-muted h-4 w-32 mx-auto rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => router.push('/dashboard/orders')}>Back to Orders</Button>
        </CardContent>
      </Card>
    );
  }

  if (user.role !== 'seller') {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Only sellers can create quotes</p>
          <Button onClick={() => router.push('/dashboard/orders')}>Back to Orders</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/orders/${order.id}`)} className="mb-4">
          ← Back to Order
        </Button>
        <h1 className="text-2xl font-display font-bold tracking-tight">Create Quote</h1>
        <p className="text-muted-foreground">Send a quote for order #{order.orderNumber}</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <p className="text-sm">Product: {order.product.title}</p>
            <p className="text-sm">Buyer: {order.buyer.displayName}</p>
            <p className="text-sm">Type: {order.type.replace(/_/g, ' ')}</p>
            <p className="text-sm font-medium">
              Original Price: {order.product.currency} {order.product.price.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Proposed Price ({order.product.currency}) *
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                required
                min="0"
              />
            </div>

            <div>
              <label htmlFor="deposit" className="block text-sm font-medium mb-2">
                Deposit Amount ({order.product.currency})
                {order.type === 'RENTAL' && ' *'}
              </label>
              <Input
                id="deposit"
                type="number"
                step="0.01"
                value={proposedDeposit}
                onChange={(e) => setProposedDeposit(e.target.value)}
                min="0"
                placeholder={order.type === 'RENTAL' ? 'Required for rentals' : 'Optional for custom orders'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {order.type === 'RENTAL' 
                  ? 'Security deposit required for rental orders' 
                  : 'Optional collateral for custom tailoring orders'}
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details about this quote..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Send Quote'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

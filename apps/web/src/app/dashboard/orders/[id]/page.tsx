'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Alert, Badge } from '@marketplace/ui';
import { useAuth } from '../../../../hooks/useAuth';
import { apiGet, apiPost } from '../../../../lib/api';
import { OrderWorkflow } from '../../../../components/orders/OrderWorkflow';

type OrderType = 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING';
type OrderStatus = 'INQUIRY_PENDING' | 'QUOTE_PROPOSED' | 'APPROVED_RESERVED' | 'READY_FOR_HANDOVER' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'MEASUREMENTS_SUBMITTED' | 'FABRIC_CUTTING' | 'TAILORING_IN_PROGRESS' | 'FITTING_READY' | 'HANDOVER_PENDING_DEPOSIT' | 'RENTAL_ACTIVE' | 'RETURN_INITIATED' | 'RETURNED_INSPECTED';

interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  agreedPrice: number;
  agreedDeposit: number | null;
  offlineDepositRefunded: boolean;
  customMeasurements: any;
  fittingDate: string | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  extensionDaysRequested: number;
  extensionApproved: boolean | null;
  preHandoverPhotos: string[];
  postReturnPhotos: string[];
  disputeNotes: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    images: any[];
  };
  conversation?: any;
  customQuotes?: any[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const user = useAuth((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nextStates, setNextStates] = useState<OrderStatus[]>([]);

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchOrder = async () => {
      try {
        const data = await apiGet<Order>(`/orders/${params.id}`);
        setOrder(data);
        
        // Fetch valid next states
        const states = await apiGet<OrderStatus[]>(`/orders/${params.id}/next-states`);
        setNextStates(states);
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [user, params.id]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    try {
      await apiPost(`/orders/${order.id}/status`, { status: newStatus });
      // Refresh order
      const data = await apiGet<Order>(`/orders/${order.id}`);
      setOrder(data);
      setSuccessMessage('Order status updated successfully');
      
      // Refresh next states
      const states = await apiGet<OrderStatus[]>(`/orders/${order.id}/next-states`);
      setNextStates(states);
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      INQUIRY_PENDING: 'bg-yellow-100 text-yellow-800',
      QUOTE_PROPOSED: 'bg-blue-100 text-blue-800',
      APPROVED_RESERVED: 'bg-green-100 text-green-800',
      READY_FOR_HANDOVER: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DISPUTED: 'bg-orange-100 text-orange-800',
      MEASUREMENTS_SUBMITTED: 'bg-teal-100 text-teal-800',
      FABRIC_CUTTING: 'bg-indigo-100 text-indigo-800',
      TAILORING_IN_PROGRESS: 'bg-pink-100 text-pink-800',
      FITTING_READY: 'bg-cyan-100 text-cyan-800',
      HANDOVER_PENDING_DEPOSIT: 'bg-amber-100 text-amber-800',
      RENTAL_ACTIVE: 'bg-emerald-100 text-emerald-800',
      RETURN_INITIATED: 'bg-violet-100 text-violet-800',
      RETURNED_INSPECTED: 'bg-slate-100 text-slate-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to view order details</p>
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

  const isSeller = user.role === 'seller';
  const otherParty = isSeller ? order.buyer : order.seller;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/orders')} className="mb-4">
          ← Back to Orders
        </Button>
        <h1 className="text-2xl font-display font-bold tracking-tight">Order #{order.orderNumber}</h1>
        <p className="text-muted-foreground">Order details and management</p>
      </div>

      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Workflow */}
        <OrderWorkflow 
          type={order.type} 
          currentStatus={order.status}
          onAction={(action) => handleStatusUpdate(action)}
        />

        {/* Order Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Order Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{order.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Product Information</h3>
              <div className="flex gap-4 mb-4">
                {order.product.images[0] && (
                  <img
                    src={order.product.images[0].url}
                    alt={order.product.title}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium">{order.product.title}</h4>
                  <p className="text-sm text-muted-foreground">{order.product.currency} {order.agreedPrice.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Financial Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agreed Price:</span>
                  <span className="font-medium">{order.product.currency} {order.agreedPrice.toLocaleString()}</span>
                </div>
                {order.agreedDeposit && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span className="font-medium">{order.product.currency} {order.agreedDeposit.toLocaleString()}</span>
                  </div>
                )}
                {order.offlineDepositRefunded && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit Refunded:</span>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">
                {isSeller ? 'Buyer' : 'Seller'} Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{otherParty.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{otherParty.email}</span>
                </div>
                {otherParty.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{otherParty.phone}</span>
                  </div>
                )}
                {otherParty.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{otherParty.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Update Order Status</h3>
            <div className="flex flex-wrap gap-2">
              {nextStates.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  onClick={() => handleStatusUpdate(status)}
                >
                  {status.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
            {nextStates.length === 0 && (
              <p className="text-muted-foreground mt-4">No status transitions available</p>
            )}
          </CardContent>
        </Card>

        {/* Quotes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Quotes</h3>
            {order.customQuotes && order.customQuotes.length > 0 ? (
              <div className="space-y-4">
                {order.customQuotes.map((quote: any) => (
                  <div key={quote.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{order.product.currency} {quote.proposedPrice.toLocaleString()}</p>
                        {quote.proposedDeposit && (
                          <p className="text-sm text-muted-foreground">
                            Deposit: {order.product.currency} {quote.proposedDeposit.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {quote.isAccepted && (
                        <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                      )}
                    </div>
                    {quote.notes && (
                      <p className="text-sm text-muted-foreground">{quote.notes}</p>
                    )}
                    {!quote.isAccepted && isSeller && (
                      <Button size="sm" className="mt-2" disabled>
                        Quote Pending
                      </Button>
                    )}
                    {!quote.isAccepted && !isSeller && (
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={async () => {
                          try {
                            await apiPost(`/orders/${order.id}/quotes/${quote.id}/accept`);
                            const data = await apiGet<Order>(`/orders/${order.id}`);
                            setOrder(data);
                            setSuccessMessage('Quote accepted successfully');
                          } catch (err) {
                            setError('Failed to accept quote');
                            console.error(err);
                          }
                        }}
                      >
                        Accept Quote
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No quotes yet</p>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Verification Photos</h3>
            
            {/* Pre-handover Photos */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Pre-Handover Photos</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload photos before handover to document item condition
              </p>
              {order.preHandoverPhotos && order.preHandoverPhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {order.preHandoverPhotos.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Pre-handover photo ${index + 1}`}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No pre-handover photos uploaded</p>
              )}
              {isSeller && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {/* TODO: Implement photo upload */}}
                >
                  Upload Pre-Handover Photos
                </Button>
              )}
            </div>

            {/* Post-return Photos */}
            <div>
              <h4 className="font-medium mb-2">Post-Return Photos</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload photos after return to document item condition
              </p>
              {order.postReturnPhotos && order.postReturnPhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {order.postReturnPhotos.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post-return photo ${index + 1}`}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No post-return photos uploaded</p>
              )}
              {isSeller && order.type === 'RENTAL' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {/* TODO: Implement photo upload */}}
                >
                  Upload Post-Return Photos
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Order Chat</h3>
            <p className="text-muted-foreground mb-4">
              Discuss this order with {isSeller ? 'the buyer' : 'the seller'}
            </p>
            <Button onClick={() => router.push(`/dashboard/messages?conversation=${order.conversation?.id}`)}>
              Open Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

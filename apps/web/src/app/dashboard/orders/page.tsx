'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Alert, Badge } from '@marketplace/ui';
import { useAuth } from '../../../hooks/useAuth';
import { apiGet } from '../../../lib/api';

type OrderType = 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING';
type OrderStatus = 'INQUIRY_PENDING' | 'QUOTE_PROPOSED' | 'APPROVED_RESERVED' | 'READY_FOR_HANDOVER' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'MEASUREMENTS_SUBMITTED' | 'FABRIC_CUTTING' | 'TAILORING_IN_PROGRESS' | 'FITTING_READY' | 'HANDOVER_PENDING_DEPOSIT' | 'RENTAL_ACTIVE' | 'RETURN_INITIATED' | 'RETURNED_INSPECTED';

interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  agreedPrice: number;
  agreedDeposit: number | null;
  customMeasurements: any;
  fittingDate: string | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  conversationId: string | null;
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
  } | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuth((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      setSuccessMessage(`Order ${success} placed successfully!`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const endpoint = user.role === 'seller' ? '/orders/seller' : '/orders/my';
        const data = await apiGet<any>(endpoint);
        const ordersArray = Array.isArray(data) ? data : [];
        setOrders(ordersArray);
      } catch (err) {
        setError('Failed to load orders');
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, [user]);

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const getStatusColor = (status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      INQUIRY_PENDING: 'bg-yellow-100 text-yellow-800',
      QUOTE_PROPOSED: 'bg-blue-100 text-blue-800',
      APPROVED_RESERVED: 'bg-green-100 text-green-800',
      READY_FOR_HANDOVER: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DISPUTED: 'bg-orange-100 text-orange-800',
      MEASUREMENTS_SUBMITTED: 'bg-purple-100 text-purple-800',
      FABRIC_CUTTING: 'bg-pink-100 text-pink-800',
      TAILORING_IN_PROGRESS: 'bg-violet-100 text-violet-800',
      FITTING_READY: 'bg-teal-100 text-teal-800',
      HANDOVER_PENDING_DEPOSIT: 'bg-amber-100 text-amber-800',
      RENTAL_ACTIVE: 'bg-cyan-100 text-cyan-800',
      RETURN_INITIATED: 'bg-lime-100 text-lime-800',
      RETURNED_INSPECTED: 'bg-emerald-100 text-emerald-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getOrderTypeLabel = (type: OrderType) => {
    const labels: Record<OrderType, string> = {
      SALE: 'Sale',
      CUSTOM_TAILORING: 'Custom Tailoring',
      RENTAL: 'Rental',
    };
    return labels[type];
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to view your orders</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight">
          {user?.role === 'seller' ? 'My Sales' : 'My Orders'}
        </h1>
        <p className="text-muted-foreground">
          {user?.role === 'seller' ? 'Track and manage your sales' : 'Track and manage your purchases'}
        </p>
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

      {/* Status Pipeline Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['ALL', 'INQUIRY_PENDING', 'QUOTE_PROPOSED', 'APPROVED_RESERVED', 'READY_FOR_HANDOVER', 'COMPLETED', 'CANCELLED', 'DISPUTED'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="whitespace-nowrap"
          >
            {status === 'ALL' ? 'All' : status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse bg-muted h-6 w-48 mx-auto rounded mb-4" />
          <div className="animate-pulse bg-muted h-4 w-32 mx-auto rounded" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {user?.role === 'seller' ? 'No sales yet' : 'You haven\'t placed any orders yet'}
            </p>
            <Button onClick={() => router.push('/')}>Browse Listings</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {order.product.images[0] && (
                    <img
                      src={order.product.images[0].url}
                      alt={order.product.title}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{order.product?.title || 'Custom Order'}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getOrderTypeLabel(order.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ETB {order.agreedPrice.toLocaleString()}
                        </p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Counterparty */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {user?.role === 'seller' ? `Buyer: ${order.buyer.displayName}` : `Seller: ${order.seller.displayName}`}
                      </span>
                    </div>
                    
                    {/* Type-specific information */}
                    {order.type === 'RENTAL' && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {order.rentalStartDate && (
                          <span>Start: {new Date(order.rentalStartDate).toLocaleDateString()}</span>
                        )}
                        {order.rentalEndDate && (
                          <span className="ml-4">End: {new Date(order.rentalEndDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    
                    {order.type === 'CUSTOM_TAILORING' && order.fittingDate && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Fitting Date: {new Date(order.fittingDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        >
                          View Details
                        </Button>
                        {order.status === 'INTENT_PLACED' && user?.role === 'seller' && (
                          <Button 
                            size="sm"
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          >
                            Respond
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

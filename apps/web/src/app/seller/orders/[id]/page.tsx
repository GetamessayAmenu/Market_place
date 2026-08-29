'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Card, CardContent, Alert } from '@marketplace/ui';
import useAuth from '../../../../hooks/useAuth';
import { apiGet, apiPatch } from '../../../../lib/api';
import MessageThread from '../../../../components/chat/MessageThread';
import { fetchConversationMessages } from '../../../../lib/chatApi';

// ─── Types ─────────────────────────────────────────────────────────────────

type OrderType = 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING';

type OrderStatus = 'INQUIRY_PENDING' | 'QUOTE_PROPOSED' | 'APPROVED_RESERVED' | 'READY_FOR_HANDOVER' | 
  'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'MEASUREMENTS_SUBMITTED' | 'FABRIC_CUTTING' | 
  'TAILORING_IN_PROGRESS' | 'FITTING_READY' | 'HANDOVER_PENDING_DEPOSIT' | 'RENTAL_ACTIVE' | 
  'RETURN_INITIATED' | 'RETURNED_INSPECTED';

interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  buyerId: string;
  sellerId: string;
  productId: string;
  conversationId: string | null;
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
  customQuotes?: any[];
  conversation?: any;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  senderId: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface ChatConversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    slug: string;
  };
  buyer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconSale = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
  </svg>
);

const IconRental = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const IconCustom = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const IconWhatsApp = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const IconPhone = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: OrderType }) {
  const config = {
    SALE: { color: 'bg-blue-100 text-blue-700', icon: <IconSale />, label: 'Sale' },
    RENTAL: { color: 'bg-purple-100 text-purple-700', icon: <IconRental />, label: 'Rental' },
    CUSTOM_TAILORING: { color: 'bg-orange-100 text-orange-700', icon: <IconCustom />, label: 'Custom Order' },
  };
  const item = (type && config[type]) || { color: 'bg-blue-100 text-blue-700', icon: <IconSale />, label: type || 'Sale' };
  const { color, icon, label } = item;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<OrderStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    INQUIRY_PENDING: 'info',
    QUOTE_PROPOSED: 'warning',
    APPROVED_RESERVED: 'success',
    READY_FOR_HANDOVER: 'success',
    COMPLETED: 'success',
    CANCELLED: 'error',
    DISPUTED: 'error',
    MEASUREMENTS_SUBMITTED: 'warning',
    FABRIC_CUTTING: 'warning',
    TAILORING_IN_PROGRESS: 'warning',
    FITTING_READY: 'success',
    HANDOVER_PENDING_DEPOSIT: 'warning',
    RENTAL_ACTIVE: 'success',
    RETURN_INITIATED: 'warning',
    RETURNED_INSPECTED: 'info',
  };
  const labels: Record<OrderStatus, string> = {
    INQUIRY_PENDING: 'Pending Inquiry',
    QUOTE_PROPOSED: 'Quote Proposed',
    APPROVED_RESERVED: 'Approved / Reserved',
    READY_FOR_HANDOVER: 'Ready for Handover',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
    MEASUREMENTS_SUBMITTED: 'Measurements Submitted',
    FABRIC_CUTTING: 'Fabric Cutting',
    TAILORING_IN_PROGRESS: 'Tailoring in Progress',
    FITTING_READY: 'Ready for Fitting',
    HANDOVER_PENDING_DEPOSIT: 'Handover Pending',
    RENTAL_ACTIVE: 'Rental Active',
    RETURN_INITIATED: 'Return Initiated',
    RETURNED_INSPECTED: 'Returned & Inspected',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// ─── Lifecycle Pipeline Tracker ─────────────────────────────────────────────

interface LifecycleStep {
  key: string;
  label: string;
  description: string;
}

const lifecycleSteps: LifecycleStep[] = [
  { key: 'INQUIRY_PENDING', label: 'Order Placed', description: 'Intent received' },
  { key: 'APPROVED_RESERVED', label: 'Measurements & Customization', description: 'Details confirmed' },
  { key: 'TAILORING_IN_PROGRESS', label: 'Production', description: 'In progress' },
  { key: 'READY_FOR_HANDOVER', label: 'Delivery & Inspection', description: 'Final checks' },
  { key: 'COMPLETED', label: 'Completed & Closed', description: 'Order fulfilled' },
];

function LifecycleTracker({ status, onStatusUpdate }: { status: OrderStatus; onStatusUpdate?: (newStatus: OrderStatus) => void }) {
  const getStatusIndex = (currentStatus: OrderStatus): number => {
    const statusOrder = ['INQUIRY_PENDING', 'QUOTE_PROPOSED', 'APPROVED_RESERVED', 'MEASUREMENTS_SUBMITTED', 
      'FABRIC_CUTTING', 'TAILORING_IN_PROGRESS', 'FITTING_READY', 'READY_FOR_HANDOVER', 'COMPLETED'];
    return statusOrder.indexOf(currentStatus);
  };

  const currentIndex = getStatusIndex(status);

  return (
    <div className="bg-gradient-to-r from-brand-wine/5 to-brand-gold/5 rounded-xl p-6 mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Order Lifecycle</h3>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-10" />
        
        {lifecycleSteps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <button
                onClick={() => onStatusUpdate?.(step.key as OrderStatus)}
                disabled={isFuture}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isPast || isCurrent 
                    ? 'bg-brand-wine text-white shadow-lg shadow-brand-wine/20' 
                    : 'bg-muted text-muted-foreground'
                } ${isFuture ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}`}
                title={step.description}
              >
                {isPast || isCurrent ? '✓' : index + 1}
              </button>
              <span className={`text-[10px] mt-2 text-center max-w-[80px] ${
                isPast || isCurrent ? 'text-brand-wine font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Customer Measurements Card ───────────────────────────────────────────────

function MeasurementsCard({ measurements }: { measurements: any }) {
  if (!measurements) return null;

  const fields = [
    { key: 'bust', label: 'Bust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'height', label: 'Height' },
    { key: 'sleeveLength', label: 'Sleeve Length' },
    { key: 'customNotes', label: 'Custom Notes' },
  ];

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-brand-wine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Customer Measurements
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(({ key, label }) => (
            measurements[key] && (
              <div key={key} className="bg-muted/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium">{measurements[key]}</p>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quote History Card ─────────────────────────────────────────────────────

function QuoteHistoryCard({ quotes, currency }: { quotes: any[]; currency: string }) {
  if (!quotes || quotes.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Quote History
        </h4>
        <div className="space-y-3">
          {quotes.map((quote) => (
            <div key={quote.id} className={`bg-muted/50 rounded-lg p-3 border-l-4 ${quote.isAccepted ? 'border-green-500' : 'border-muted'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </span>
                {quote.isAccepted && (
                  <Badge variant="success" className="text-[10px]">Accepted</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currency} {Number(quote.proposedPrice).toLocaleString()}</p>
                  {quote.proposedDeposit && (
                    <p className="text-xs text-muted-foreground">
                      Deposit: {currency} {Number(quote.proposedDeposit).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {quote.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">{quote.notes}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── External Action Hub ─────────────────────────────────────────────────────

function ExternalActionHub({ buyer, orderNumber }: { buyer: Order['buyer']; orderNumber: string }) {
  const whatsappMessage = encodeURIComponent(
    `Hello! I'm contacting you regarding your order ${orderNumber}. Let's discuss the details.`
  );
  const whatsappUrl = buyer.phone 
    ? `https://wa.me/${buyer.phone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  return (
    <div className="flex gap-2 mt-4">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 px-3 text-sm font-medium transition-colors"
        >
          <IconWhatsApp />
          WhatsApp
        </a>
      )}
      {buyer.phone && (
        <a
          href={`tel:${buyer.phone}`}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-wine hover:bg-brand-wine/90 text-white rounded-lg py-2 px-3 text-sm font-medium transition-colors"
        >
          <IconPhone />
          Call
        </a>
      )}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch order and conversation data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orderData = await apiGet<Order>(`/orders/${params.id}`);
        
        // Verify user is the seller
        if (orderData.sellerId !== user?.id) {
          setError('You are not authorized to view this order');
          return;
        }
        
        setOrder(orderData);

        // Fetch conversation and messages if available
        if (orderData.conversationId) {
          try {
            const convData = await apiGet<ChatConversation>(`/conversations/${orderData.conversationId}`);
            setConversation(convData);
            
            const messagesData = await fetchConversationMessages(orderData.conversationId);
            setMessages(messagesData.data);
          } catch (chatError) {
            console.error('Failed to fetch conversation:', chatError);
          }
        }
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && params.id) {
      fetchData();
    }
  }, [params.id, user]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || updatingStatus) return;

    try {
      setUpdatingStatus(true);
      const updatedOrder = await apiPatch<Order>(`/orders/${order.id}/status`, { status: newStatus });
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!order) return;
    await handleStatusUpdate('COMPLETED');
  };

  const handleCloseConversation = async () => {
    if (!order) return;
    // Archive logic - could be implemented via a dedicated endpoint
    router.push('/seller/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-wine mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="error">{error || 'Order not found'}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
                <p className="text-sm text-muted-foreground">{order.product.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TypeBadge type={order.type} />
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Lifecycle Tracker */}
        <LifecycleTracker status={order.status} onStatusUpdate={handleStatusUpdate} />

        {/* Dual Panel Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Order Metadata */}
          <div className="space-y-6">
            {/* Product Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {order.product.images?.[0] && (
                    <img
                      src={order.product.images[0].url}
                      alt={order.product.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{order.product.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {order.product.currency} {order.agreedPrice.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={order.type} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info Card */}
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {order.buyer.avatarUrl ? (
                        <img src={order.buyer.avatarUrl} alt={order.buyer.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium">{order.buyer.displayName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{order.buyer.displayName}</p>
                      <p className="text-xs text-muted-foreground">{order.buyer.email}</p>
                    </div>
                  </div>
                  {order.buyer.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {order.buyer.location}
                    </p>
                  )}
                </div>
                <ExternalActionHub buyer={order.buyer} orderNumber={order.orderNumber} />
              </CardContent>
            </Card>

            {/* Measurements Card */}
            {order.type === 'CUSTOM_TAILORING' && (
              <MeasurementsCard measurements={order.customMeasurements} />
            )}

            {/* Quote History */}
            <QuoteHistoryCard quotes={order.customQuotes || []} currency={order.product.currency} />

            {/* Financial Summary */}
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3">Financial Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Agreed Price</span>
                    <span className="font-medium">
                      {order.product.currency} {order.agreedPrice.toLocaleString()}
                    </span>
                  </div>
                  {order.agreedDeposit && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Security Deposit</span>
                      <span className="font-medium">
                        {order.product.currency} {order.agreedDeposit.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {order.type === 'RENTAL' && order.offlineDepositRefunded !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Deposit Refunded</span>
                      <span className={`font-medium ${order.offlineDepositRefunded ? 'text-green-600' : 'text-amber-600'}`}>
                        {order.offlineDepositRefunded ? 'Yes' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rental Dates */}
            {order.type === 'RENTAL' && order.rentalStartDate && order.rentalEndDate && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Rental Period</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(order.rentalStartDate).toLocaleDateString()}</p>
                      </div>
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="font-medium">{new Date(order.rentalEndDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Contextual Chat */}
          <div className="h-[600px] lg:h-auto">
            {conversation ? (
              <div className="h-full flex flex-col bg-background border rounded-xl overflow-hidden">
                <MessageThread
                  conversation={conversation}
                  currentUserId={user?.id || ''}
                  initialMessages={messages}
                />
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center p-8">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium mb-1">No conversation yet</p>
                  <p className="text-xs text-muted-foreground">
                    Start a conversation with the buyer about this order
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <Button
                onClick={handleMarkCompleted}
                disabled={updatingStatus}
                className="bg-brand-wine hover:bg-brand-wine/90"
              >
                Mark as Completed / Delivered
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCloseConversation}
            >
              Close Conversation & Archive
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-20" />
    </div>
  );
}

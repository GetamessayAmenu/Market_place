'use client';

import React, { useState } from 'react';

import { useAuth } from '../../../hooks/useAuth';
import { formatRelativeTime } from '../../../lib/formatters';

// Types
type OrderType = 'all' | 'sale' | 'custom' | 'rental';
type OrderStatus = 'all' | 'needs_action' | 'active' | 'completed' | 'cancelled';

type RentalStage = 
  | 'booking_request'
  | 'availability_check'
  | 'booking_confirmation'
  | 'rental_details'
  | 'rental_agreement'
  | 'item_preparation'
  | 'pickup'
  | 'rental_active'
  | 'extension_request'
  | 'return'
  | 'inspection'
  | 'damage_report'
  | 'rental_history'
  | 'completion';

type CustomOrderStage = 
  | 'product_setup'
  | 'custom_request'
  | 'seller_review'
  | 'discussion'
  | 'quotation'
  | 'approval'
  | 'payment'
  | 'production'
  | 'revision'
  | 'delivery'
  | 'completion';

interface RentalData {
  startDate: string;
  endDate: string;
  depositAmount: number;
  stage: RentalStage;
  preparationChecklist: {
    cleaning: boolean;
    ironing: boolean;
    qualityCheck: boolean;
    packaging: boolean;
  };
  pickupNotes?: string;
  returnNotes?: string;
  inspectionNotes?: string;
  damageReport?: {
    description: string;
    photos: string[];
    repairNotes: string;
  };
  extensionRequest?: {
    requestedDays: number;
    status: 'pending' | 'approved' | 'rejected';
  };
}

interface MeasurementData {
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  sleeveLength?: number;
  length?: number;
  neck?: number;
  customMeasurements?: { name: string; value: number; unit: string }[];
}

interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ProductionStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  photos?: string[];
}

interface Revision {
  id: string;
  requestedBy: 'customer' | 'seller';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
}

interface TimelineEvent {
  id: string;
  stage: CustomOrderStage;
  action: string;
  description: string;
  actor: 'customer' | 'seller' | 'system';
  timestamp: string;
}

interface CustomOrderData {
  stage: CustomOrderStage;
  productId: string;
  customRequest: {
    description: string;
    occasion?: string;
    budget?: number;
    deadline?: string;
    referenceImages: string[];
  };
  measurements: {
    type: 'standard' | 'custom';
    data: MeasurementData;
    status: 'pending' | 'provided' | 'verified';
  };
  quotation: {
    items: QuotationItem[];
    subtotal: number;
    deposit: number;
    total: number;
    validityDays: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    sentAt?: string;
    expiresAt?: string;
  };
  production: {
    stages: ProductionStage[];
    currentStage: number;
    estimatedCompletion: string;
    actualCompletion?: string;
  };
  revisions: {
    allowed: number;
    used: number;
    history: Revision[];
  };
  files: {
    designFiles: string[];
    progressPhotos: string[];
    finalPhotos: string[];
  };
  timeline: TimelineEvent[];
  discussionThreadId?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  type: 'sale' | 'custom' | 'rental';
  status: 'needs_action' | 'active' | 'completed' | 'cancelled';
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  products: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  rentalData?: RentalData;
  customData?: CustomOrderData;
}

export default function OrderManagementPage() {
  const user = useAuth((s) => s.user);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('all');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock orders data
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      type: 'sale',
      status: 'needs_action',
      customer: {
        name: 'Hirut Tesfaye',
        email: 'hirut@example.com',
        phone: '+251 911 123 456',
      },
      products: [
        { id: 'p1', name: 'Traditional Habesha Dress', quantity: 1, price: 5000 },
      ],
      totalAmount: 5000,
      paymentStatus: 'paid',
      createdAt: '2026-06-28T10:00:00Z',
      updatedAt: '2026-06-30T14:30:00Z',
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      type: 'custom',
      status: 'active',
      customer: {
        name: 'Abebe Kebede',
        email: 'abebe@example.com',
        phone: '+251 922 234 567',
      },
      products: [
        { id: 'p2', name: 'Custom Men\'s Gabi', quantity: 2, price: 3000 },
      ],
      totalAmount: 6000,
      paymentStatus: 'paid',
      createdAt: '2026-06-25T09:00:00Z',
      updatedAt: '2026-06-29T16:00:00Z',
      customData: {
        stage: 'production',
        productId: 'prod-123',
        customRequest: {
          description: 'Custom traditional Gabi for wedding ceremony. Needs embroidery work on cuffs and collar.',
          occasion: 'Wedding',
          budget: 7000,
          deadline: '2026-07-15',
          referenceImages: ['img1.jpg', 'img2.jpg'],
        },
        measurements: {
          type: 'custom',
          data: {
            chest: 110,
            waist: 95,
            shoulder: 50,
            sleeveLength: 65,
            length: 140,
          },
          status: 'verified',
        },
        quotation: {
          items: [
            { description: 'White cotton fabric (3 yards)', quantity: 3, unitPrice: 500, total: 1500 },
            { description: 'Embroidery work (cuffs)', quantity: 1, unitPrice: 800, total: 800 },
            { description: 'Embroidery work (collar)', quantity: 1, unitPrice: 600, total: 600 },
            { description: 'Labor and tailoring', quantity: 1, unitPrice: 2000, total: 2000 },
            { description: 'Lining fabric', quantity: 2, unitPrice: 400, total: 800 },
          ],
          subtotal: 5700,
          deposit: 2850,
          total: 6000,
          validityDays: 7,
          status: 'accepted',
          sentAt: '2026-06-25T10:00:00Z',
          expiresAt: '2026-07-02T10:00:00Z',
        },
        production: {
          stages: [
            { id: '1', name: 'Fabric Sourcing', description: 'Source and purchase required fabrics', status: 'completed', startedAt: '2026-06-26T09:00:00Z', completedAt: '2026-06-27T17:00:00Z' },
            { id: '2', name: 'Pattern Making', description: 'Create pattern based on measurements', status: 'completed', startedAt: '2026-06-28T09:00:00Z', completedAt: '2026-06-29T17:00:00Z' },
            { id: '3', name: 'Cutting', description: 'Cut fabric according to pattern', status: 'in_progress', startedAt: '2026-06-30T09:00:00Z' },
            { id: '4', name: 'Sewing', description: 'Main sewing and assembly', status: 'pending' },
            { id: '5', name: 'Embroidery', description: 'Add embroidery work', status: 'pending' },
            { id: '6', name: 'Fitting', description: 'Initial fitting and adjustments', status: 'pending' },
            { id: '7', name: 'Final Touches', description: 'Final finishing and quality check', status: 'pending' },
          ],
          currentStage: 2,
          estimatedCompletion: '2026-07-12',
        },
        revisions: {
          allowed: 2,
          used: 0,
          history: [],
        },
        files: {
          designFiles: ['design1.jpg', 'design2.jpg'],
          progressPhotos: ['progress1.jpg'],
          finalPhotos: [],
        },
        timeline: [
          { id: '1', stage: 'custom_request', action: 'Request Submitted', description: 'Customer submitted custom order request', actor: 'customer', timestamp: '2026-06-25T08:00:00Z' },
          { id: '2', stage: 'seller_review', action: 'Request Reviewed', description: 'Seller reviewed and accepted request', actor: 'seller', timestamp: '2026-06-25T09:30:00Z' },
          { id: '3', stage: 'discussion', action: 'Discussion Started', description: 'Discussion thread created', actor: 'system', timestamp: '2026-06-25T09:35:00Z' },
          { id: '4', stage: 'quotation', action: 'Quotation Sent', description: 'Quotation sent to customer', actor: 'seller', timestamp: '2026-06-25T10:00:00Z' },
          { id: '5', stage: 'approval', action: 'Quotation Accepted', description: 'Customer accepted quotation', actor: 'customer', timestamp: '2026-06-25T14:00:00Z' },
          { id: '6', stage: 'payment', action: 'Deposit Paid', description: 'Customer paid deposit', actor: 'customer', timestamp: '2026-06-25T15:00:00Z' },
          { id: '7', stage: 'production', action: 'Production Started', description: 'Production process initiated', actor: 'seller', timestamp: '2026-06-26T09:00:00Z' },
        ],
        discussionThreadId: 'thread-456',
      },
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      type: 'rental',
      status: 'active',
      customer: {
        name: 'Selam Bekele',
        email: 'selam@example.com',
        phone: '+251 933 345 678',
      },
      products: [
        { id: 'p3', name: 'Evening Gown - Size M', quantity: 1, price: 1500 },
      ],
      totalAmount: 1500,
      paymentStatus: 'paid',
      createdAt: '2026-06-30T11:00:00Z',
      updatedAt: '2026-06-30T11:00:00Z',
      rentalData: {
        startDate: '2026-07-05',
        endDate: '2026-07-10',
        depositAmount: 3000,
        stage: 'item_preparation',
        preparationChecklist: {
          cleaning: true,
          ironing: false,
          qualityCheck: false,
          packaging: false,
        },
      },
    },
    {
      id: '4',
      orderNumber: 'ORD-004',
      type: 'sale',
      status: 'completed',
      customer: {
        name: 'Dawit Alemu',
        email: 'dawit@example.com',
        phone: '+251 944 456 789',
      },
      products: [
        { id: 'p4', name: 'Women\'s Netela', quantity: 3, price: 800 },
      ],
      totalAmount: 2400,
      paymentStatus: 'paid',
      createdAt: '2026-06-20T08:00:00Z',
      updatedAt: '2026-06-25T12:00:00Z',
    },
    {
      id: '5',
      orderNumber: 'ORD-005',
      type: 'custom',
      status: 'needs_action',
      customer: {
        name: 'Mekdes Tadesse',
        email: 'mekdes@example.com',
        phone: '+251 955 567 890',
      },
      products: [
        { id: 'p5', name: 'Custom Kaba Set', quantity: 1, price: 8000 },
      ],
      totalAmount: 8000,
      paymentStatus: 'paid',
      createdAt: '2026-07-01T07:00:00Z',
      updatedAt: '2026-07-01T07:00:00Z',
    },
  ];

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const typeMatch = selectedOrderType === 'all' || order.type === selectedOrderType;
    const statusMatch = selectedStatus === 'all' || order.status === selectedStatus;
    const searchMatch =
      searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action}`, Array.from(selectedOrders));
    // Implement bulk action logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needs_action':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'active':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return '🛒';
      case 'custom':
        return '✂️';
      case 'rental':
        return '📦';
      default:
        return '📋';
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in to view order management.</p>
      </div>
    );
  }

  if (selectedOrder) {
    return <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Order Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all your sale, rental, and custom orders
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'sale', 'custom', 'rental'] as OrderType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedOrderType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedOrderType === type
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {type === 'all' ? 'All Orders' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'needs_action', 'active', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {status === 'all'
                  ? 'All Status'
                  : status
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pl-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-orange-50 p-4 border border-orange-200">
            <span className="text-sm font-medium text-orange-700">
              {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleBulkAction('mark_active')}
                className="px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
              >
                Mark as Active
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('mark_completed')}
                className="px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
              >
                Mark as Completed
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
              >
                Export
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedOrders(new Set())}
              className="ml-auto text-sm text-orange-700 hover:text-orange-800"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="font-medium text-foreground hover:text-orange-600 transition-colors"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{order.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-2xl" aria-label={order.type}>
                        {getTypeIcon(order.type)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status
                          .split('_')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : order.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground">
                      ETB {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatRelativeTime(new Date(order.createdAt))}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No orders found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Details Component
function OrderDetails({ order, onBack }: { order: Order; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-foreground transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-foreground mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{order.customer.phone}</p>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-foreground mb-4">Products</h2>
              <div className="space-y-4">
                {order.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {product.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">ETB {product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-foreground">ETB {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-foreground mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : order.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">ETB {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Workflow */}
          <div className="space-y-6">
            {order.type === 'sale' && <SaleWorkflow order={order} />}
            {order.type === 'custom' && <CustomWorkflow order={order} />}
            {order.type === 'rental' && <RentalWorkflow order={order} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sale Workflow Component
function SaleWorkflow({ order }: { order: Order }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-foreground mb-4">Sale Workflow</h2>
      <div className="space-y-4">
        <WorkflowStep
          title="Packing"
          status="completed"
          description="Items have been packed"
        />
        <WorkflowStep
          title="Shipping"
          status={order.status === 'completed' ? 'completed' : 'in_progress'}
          description="Prepare shipment"
        />
        <WorkflowStep
          title="Tracking"
          status={order.status === 'completed' ? 'completed' : 'pending'}
          description="Add tracking information"
        />
      </div>
    </div>
  );
}

// Custom Workflow Component
function CustomWorkflow({ order }: { order: Order }) {
  const [currentStage, setCurrentStage] = useState<CustomOrderStage>(
    order.customData?.stage || 'custom_request'
  );

  const stages: { key: CustomOrderStage; title: string; icon: string }[] = [
    { key: 'product_setup', title: 'Product Setup', icon: '⚙️' },
    { key: 'custom_request', title: 'Custom Request', icon: '📝' },
    { key: 'seller_review', title: 'Seller Review', icon: '👁️' },
    { key: 'discussion', title: 'Discussion', icon: '💬' },
    { key: 'quotation', title: 'Quotation', icon: '💰' },
    { key: 'approval', title: 'Approval', icon: '✅' },
    { key: 'payment', title: 'Payment', icon: '💳' },
    { key: 'production', title: 'Production', icon: '🧵' },
    { key: 'revision', title: 'Revision', icon: '🔄' },
    { key: 'delivery', title: 'Delivery', icon: '📦' },
    { key: 'completion', title: 'Completion', icon: '🎉' },
  ];

  const getStageIndex = (stage: CustomOrderStage) => stages.findIndex((s) => s.key === stage);

  const moveToNextStage = () => {
    const currentIndex = getStageIndex(currentStage);
    const nextStage = stages[currentIndex + 1];
    if (currentIndex < stages.length - 1 && nextStage) {
      setCurrentStage(nextStage.key);
    }
  };

  const moveToPreviousStage = () => {
    const currentIndex = getStageIndex(currentStage);
    const prevStage = stages[currentIndex - 1];
    if (currentIndex > 0 && prevStage) {
      setCurrentStage(prevStage.key);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Progress */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-foreground mb-4">Custom Order Workflow</h2>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, index) => {
            const stageIndex = getStageIndex(currentStage);
            const isCompleted = index < stageIndex;
            const isCurrent = index === stageIndex;
            const isPending = index > stageIndex;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setCurrentStage(stage.key)}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : isCurrent
                    ? 'bg-orange-500 text-white border border-orange-500'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                aria-label={`${stage.title} - ${isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}`}
              >
                <span>{stage.icon}</span>
                <span className="hidden sm:inline">{stage.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Stage Content */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            {stages[getStageIndex(currentStage)]?.title || 'Unknown Stage'}
          </h3>
          <span className="text-sm text-muted-foreground">
            Stage {getStageIndex(currentStage) + 1} of {stages.length}
          </span>
        </div>

        {currentStage === 'product_setup' && <ProductSetupStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'custom_request' && <CustomRequestStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'seller_review' && <SellerReviewStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'discussion' && <DiscussionStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'quotation' && <QuotationStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'approval' && <ApprovalStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'payment' && <PaymentStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'production' && <ProductionStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'revision' && <RevisionStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'delivery' && <DeliveryStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'completion' && <CompletionStage order={order} onNext={moveToNextStage} />}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={moveToPreviousStage}
            disabled={getStageIndex(currentStage) === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            type="button"
            onClick={moveToNextStage}
            disabled={getStageIndex(currentStage) === stages.length - 1}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Stage 1: Product Setup
function ProductSetupStage({ onNext }: { order: Order; onNext: () => void }) {
  const [isCustomizable, setIsCustomizable] = useState(true);
  const [customizationOptions, setCustomizationOptions] = useState({
    fabric: true,
    size: true,
    style: true,
    embroidery: true,
  });

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Configure product as customizable and define available options.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={isCustomizable}
            onChange={(e) => setIsCustomizable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Enable Customization</p>
            <p className="text-xs text-muted-foreground">Allow customers to request custom versions</p>
          </div>
        </label>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Customization Options</label>
          <div className="space-y-2">
            {Object.keys(customizationOptions).map((option) => (
              <label key={option} className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={customizationOptions[option as keyof typeof customizationOptions]}
                  onChange={(e) => setCustomizationOptions({ ...customizationOptions, [option]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-foreground capitalize">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Base Price Range (ETB)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <input
              type="number"
              placeholder="Max"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Production Timeline (days)</label>
          <input
            type="number"
            placeholder="e.g., 14"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Save & Continue
      </button>
    </div>
  );
}

// Stage 2: Custom Request
function CustomRequestStage({ order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Customer submits custom order request with details.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-lg">
            {order.customData?.customRequest.description || 'No description provided'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Occasion</label>
            <p className="text-sm text-muted-foreground">{order.customData?.customRequest.occasion || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Budget</label>
            <p className="text-sm text-muted-foreground">
              {order.customData?.customRequest.budget ? `ETB ${order.customData.customRequest.budget.toLocaleString()}` : 'Not specified'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
          <p className="text-sm text-muted-foreground">
            {order.customData?.customRequest.deadline ? new Date(order.customData.customRequest.deadline).toLocaleDateString() : 'Not specified'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Reference Images</label>
          <div className="flex gap-2">
            {order.customData?.customRequest.referenceImages.map((img, i) => (
              <div key={i} className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
                {img}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Review Request
      </button>
    </div>
  );
}

// Stage 3: Seller Review
function SellerReviewStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Seller reviews request and decides to accept or reject.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Request Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget:</span>
            <span className="font-medium">
              {order.customData?.customRequest.budget ? `ETB ${order.customData.customRequest.budget.toLocaleString()}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deadline:</span>
            <span className="font-medium">
              {order.customData?.customRequest.deadline ? new Date(order.customData.customRequest.deadline).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Review Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          rows={3}
          placeholder="Add notes about your review..."
        />
      </div>

      {!decision ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDecision('accept')}
            className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
          >
            Accept Request
          </button>
          <button
            type="button"
            onClick={() => setDecision('reject')}
            className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            Reject Request
          </button>
        </div>
      ) : (
        <div className={`rounded-lg p-4 ${decision === 'accept' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${decision === 'accept' ? 'text-green-800' : 'text-red-800'}`}>
            {decision === 'accept' ? '✅ Request accepted!' : '❌ Request rejected'}
          </p>
        </div>
      )}

      {decision === 'accept' && (
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          Start Discussion
        </button>
      )}
    </div>
  );
}

// Stage 4: Discussion
function DiscussionStage({ onNext }: { order: Order; onNext: () => void }) {
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Discuss requirements, clarify details, and agree on specifications.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Discussion Thread</h4>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-medium">
              C
            </div>
            <div className="flex-1 bg-slate-50 rounded-lg p-2 text-sm">
              <p className="font-medium text-foreground">Customer</p>
              <p className="text-muted-foreground">I'd like to add gold embroidery instead of silver.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-medium">
              S
            </div>
            <div className="flex-1 bg-slate-50 rounded-lg p-2 text-sm">
              <p className="font-medium text-foreground">Seller</p>
              <p className="text-muted-foreground">That's possible. Gold thread will add ETB 200 to the cost.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Send Message</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <button
            type="button"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            Send
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Ready for Quotation
      </button>
    </div>
  );
}

// Stage 5: Quotation
function QuotationStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const quotation = order.customData?.quotation;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Create and send detailed quotation to customer.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Quotation Items</h4>
        <div className="space-y-2 text-sm">
          {quotation?.items.map((item, i) => (
            <div key={i} className="flex justify-between p-2 bg-slate-50 rounded">
              <div>
                <p className="font-medium text-foreground">{item.description}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ETB {item.unitPrice.toLocaleString()}</p>
              </div>
              <p className="font-medium text-foreground">ETB {item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>ETB {quotation?.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit (50%):</span>
            <span>ETB {quotation?.deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-foreground">
            <span>Total:</span>
            <span>ETB {quotation?.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Quotation Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-medium ${
              quotation?.status === 'accepted' ? 'text-green-600' :
              quotation?.status === 'rejected' ? 'text-red-600' :
              quotation?.status === 'expired' ? 'text-orange-600' :
              'text-blue-600'
            }`}>
              {quotation?.status ? quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1) : 'Draft'}
            </span>
          </div>
          {quotation?.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span>{new Date(quotation.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        {quotation?.status === 'accepted' ? 'Proceed to Payment' : 'Send Quotation'}
      </button>
    </div>
  );
}

// Stage 6: Approval
function ApprovalStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const [approved, setApproved] = useState(order.customData?.quotation?.status === 'accepted');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Customer reviews and accepts or negotiates the quotation.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Quotation Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-bold text-foreground">ETB {order.customData?.quotation?.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit Required:</span>
            <span className="font-medium text-foreground">ETB {order.customData?.quotation?.deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance Due:</span>
            <span className="font-medium text-foreground">
              ETB {(order.customData?.quotation?.total || 0) - (order.customData?.quotation?.deposit || 0)}
            </span>
          </div>
        </div>
      </div>

      {!approved ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setApproved(true)}
            className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
          >
            Accept Quotation
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Request Changes
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">✅ Quotation accepted by customer</p>
        </div>
      )}

      {approved && (
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          Proceed to Payment
        </button>
      )}
    </div>
  );
}

// Stage 7: Payment
function PaymentStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const depositPaid = order.paymentStatus === 'paid';

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Customer pays deposit to initiate production.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Payment Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit Amount:</span>
            <span className="font-bold text-foreground">ETB {order.customData?.quotation?.deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Status:</span>
            <span className={`font-medium ${
              order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {!depositPaid ? (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Deposit payment required to begin production.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">✅ Deposit payment received</p>
        </div>
      )}

      {depositPaid && (
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          Start Production
        </button>
      )}
    </div>
  );
}

// Stage 8: Production
function ProductionStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const production = order.customData?.production;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Track production progress through all stages.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Production Stages</h4>
        <div className="space-y-3">
          {production?.stages.map((stage) => (
            <div key={stage.id} className="flex items-start gap-3">
              <div
                className={`mt-1 h-3 w-3 rounded-full ${
                  stage.status === 'completed' ? 'bg-green-500' :
                  stage.status === 'in_progress' ? 'bg-orange-500' :
                  'bg-slate-300'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{stage.name}</p>
                  <span className={`text-xs font-medium ${
                    stage.status === 'completed' ? 'text-green-600' :
                    stage.status === 'in_progress' ? 'text-orange-600' :
                    'text-slate-500'
                  }`}>
                    {stage.status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{stage.description}</p>
                {stage.startedAt && (
                  <p className="text-xs text-muted-foreground">
                    Started: {new Date(stage.startedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Timeline</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Completion:</span>
            <span className="font-medium">
              {production?.estimatedCompletion ? new Date(production.estimatedCompletion).toLocaleDateString() : 'TBD'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Stage:</span>
            <span className="font-medium">
              {production?.stages[production.currentStage]?.name || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        {production?.stages.every(s => s.status === 'completed') ? 'Proceed to Delivery' : 'Update Progress'}
      </button>
    </div>
  );
}

// Stage 9: Revision
function RevisionStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const revisions = order.customData?.revisions;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Handle customer revision requests within allowed limit.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Revision Allowance</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Allowed:</span>
            <span className="font-medium">{revisions?.allowed || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Used:</span>
            <span className="font-medium">{revisions?.used || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining:</span>
            <span className={`font-medium ${(revisions?.allowed || 0) - (revisions?.used || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(revisions?.allowed || 0) - (revisions?.used || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Revision History</h4>
        {revisions?.history && revisions.history.length > 0 ? (
          <div className="space-y-2 text-sm">
            {revisions.history.map((rev) => (
              <div key={rev.id} className="p-2 bg-slate-50 rounded">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{rev.requestedBy === 'customer' ? 'Customer' : 'Seller'}</span>
                  <span className={`text-xs ${
                    rev.status === 'completed' ? 'text-green-600' :
                    rev.status === 'in_progress' ? 'text-orange-600' :
                    'text-slate-500'
                  }`}>
                    {rev.status}
                  </span>
                </div>
                <p className="text-muted-foreground">{rev.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No revision history</p>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Proceed to Delivery
      </button>
    </div>
  );
}

// Stage 10: Delivery
function DeliveryStage({ onNext }: { order: Order; onNext: () => void }) {
  const [finalPhotosUploaded, setFinalPhotosUploaded] = useState(false);
  const [packagingComplete, setPackagingComplete] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Final quality check, photos, and prepare for delivery.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={finalPhotosUploaded}
            onChange={(e) => setFinalPhotosUploaded(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Final Photos Uploaded</p>
            <p className="text-xs text-muted-foreground">Customer approval photos</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={packagingComplete}
            onChange={(e) => setPackagingComplete(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Packaging Complete</p>
            <p className="text-xs text-muted-foreground">Item ready for delivery</p>
          </div>
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Delivery Options</h4>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="delivery" className="h-4 w-4 text-orange-500 focus:ring-orange-500" />
            <span>Store Pickup</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="delivery" className="h-4 w-4 text-orange-500 focus:ring-orange-500" />
            <span>Delivery (ETB 200)</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!finalPhotosUploaded || !packagingComplete}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Order
      </button>
    </div>
  );
}

// Stage 11: Completion
function CompletionStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const timeline = order.customData?.timeline;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Final summary, balance payment, and archive order.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Final Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-medium">ETB {order.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit Paid:</span>
            <span className="font-medium text-green-600">ETB {order.customData?.quotation?.deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance Due:</span>
            <span className="font-bold text-foreground">
              ETB {(order.totalAmount - (order.customData?.quotation?.deposit || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Workflow Timeline</h4>
        <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
          {timeline?.map((event) => (
            <div key={event.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                event.actor === 'customer' ? 'bg-orange-500' :
                event.actor === 'seller' ? 'bg-green-500' :
                'bg-slate-400'
              }`} />
              <span className="text-muted-foreground">{event.action}</span>
              <span className="ml-auto text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-lg font-semibold text-green-800 mb-2">🎉 Custom Order Complete!</p>
        <p className="text-sm text-green-700">Order has been archived into history.</p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Archive & Close
      </button>
    </div>
  );
}

// Rental Workflow Component
function RentalWorkflow({ order }: { order: Order }) {
  const [currentStage, setCurrentStage] = useState<RentalStage>(
    order.rentalData?.stage || 'booking_request'
  );

  const stages: { key: RentalStage; title: string; icon: string }[] = [
    { key: 'booking_request', title: 'Booking Request', icon: '📝' },
    { key: 'availability_check', title: 'Availability Check', icon: '📅' },
    { key: 'booking_confirmation', title: 'Booking Confirmation', icon: '✅' },
    { key: 'rental_details', title: 'Rental Details', icon: '📋' },
    { key: 'rental_agreement', title: 'Rental Agreement', icon: '📄' },
    { key: 'item_preparation', title: 'Item Preparation', icon: '🧹' },
    { key: 'pickup', title: 'Pickup', icon: '📦' },
    { key: 'rental_active', title: 'Rental Active', icon: '⏱️' },
    { key: 'extension_request', title: 'Extension Request', icon: '🔄' },
    { key: 'return', title: 'Return', icon: '↩️' },
    { key: 'inspection', title: 'Inspection', icon: '🔍' },
    { key: 'damage_report', title: 'Damage Report', icon: '⚠️' },
    { key: 'rental_history', title: 'Rental History', icon: '📊' },
    { key: 'completion', title: 'Completion', icon: '🎉' },
  ];

  const getStageIndex = (stage: RentalStage) => stages.findIndex((s) => s.key === stage);

  const moveToNextStage = () => {
    const currentIndex = getStageIndex(currentStage);
    const nextStage = stages[currentIndex + 1];
    if (currentIndex < stages.length - 1 && nextStage) {
      setCurrentStage(nextStage.key);
    }
  };

  const moveToPreviousStage = () => {
    const currentIndex = getStageIndex(currentStage);
    const prevStage = stages[currentIndex - 1];
    if (currentIndex > 0 && prevStage) {
      setCurrentStage(prevStage.key);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Progress */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-foreground mb-4">Rental Workflow</h2>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, index) => {
            const stageIndex = getStageIndex(currentStage);
            const isCompleted = index < stageIndex;
            const isCurrent = index === stageIndex;
            const isPending = index > stageIndex;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setCurrentStage(stage.key)}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : isCurrent
                    ? 'bg-orange-500 text-white border border-orange-500'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                aria-label={`${stage.title} - ${isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}`}
              >
                <span>{stage.icon}</span>
                <span className="hidden sm:inline">{stage.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Stage Content */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            {stages[getStageIndex(currentStage)]?.title || 'Unknown Stage'}
          </h3>
          <span className="text-sm text-muted-foreground">
            Stage {getStageIndex(currentStage) + 1} of {stages.length}
          </span>
        </div>

        {currentStage === 'booking_request' && <BookingRequestStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'availability_check' && <AvailabilityCheckStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'booking_confirmation' && <BookingConfirmationStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'rental_details' && <RentalDetailsStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'rental_agreement' && <RentalAgreementStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'item_preparation' && <ItemPreparationStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'pickup' && <PickupStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'rental_active' && <RentalActiveStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'extension_request' && <ExtensionRequestStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'return' && <ReturnStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'inspection' && <InspectionStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'damage_report' && <DamageReportStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'rental_history' && <RentalHistoryStage order={order} onNext={moveToNextStage} />}
        {currentStage === 'completion' && <RentalCompletionStage order={order} onNext={moveToNextStage} />}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={moveToPreviousStage}
            disabled={getStageIndex(currentStage) === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            type="button"
            onClick={moveToNextStage}
            disabled={getStageIndex(currentStage) === stages.length - 1}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Stage 1: Booking Request
function BookingRequestStage({ order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Review and accept or reject the customer's rental booking request.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Customer</label>
          <p className="text-sm text-muted-foreground">{order.customer.name}</p>
          <p className="text-sm text-muted-foreground">{order.customer.email}</p>
          <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Requested Item</label>
          <p className="text-sm text-muted-foreground">{order.products?.[0]?.name || 'Unknown Item'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Rental Duration</label>
          <p className="text-sm text-muted-foreground">
            {order.rentalData?.startDate ? new Date(order.rentalData.startDate).toLocaleDateString() : 'Not specified'} - 
            {order.rentalData?.endDate ? new Date(order.rentalData.endDate).toLocaleDateString() : 'Not specified'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Security Deposit</label>
          <p className="text-sm text-muted-foreground">
            ETB {order.rentalData?.depositAmount?.toLocaleString() || 'Not specified'}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
        >
          Accept Booking
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
        >
          Reject Booking
        </button>
      </div>
    </div>
  );
}

// Stage 2: Availability Check
function AvailabilityCheckStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Check item availability for the requested dates and detect conflicts.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Calendar View</h4>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="font-medium text-slate-600 py-2">{day}</div>
          ))}
          {Array.from({ length: 30 }).map((_, i) => {
            const isRequested = i >= 5 && i <= 10;
            const isBooked = (i >= 15 && i <= 18) || (i >= 25 && i <= 27);
            return (
              <div
                key={i}
                className={`py-2 rounded ${
                  isRequested
                    ? 'bg-orange-500 text-white'
                    : isBooked
                    ? 'bg-slate-300 text-slate-600'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>Requested</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-300 rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-50 border rounded" />
            <span>Available</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-green-50 border border-green-200 p-4">
        <p className="text-sm text-green-800">
          ✅ Item is available for the requested dates. No conflicts detected.
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Confirm Availability & Continue
      </button>
    </div>
  );
}

// Stage 3: Booking Confirmation
function BookingConfirmationStage({ order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Confirm the rental period and schedule pickup/return.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <h4 className="font-medium text-foreground">Rental Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item:</span>
            <span className="font-medium">{order.products?.[0]?.name || 'Unknown Item'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date:</span>
            <span className="font-medium">
              {order.rentalData?.startDate ? new Date(order.rentalData.startDate).toLocaleDateString() : 'TBD'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End Date:</span>
            <span className="font-medium">
              {order.rentalData?.endDate ? new Date(order.rentalData.endDate).toLocaleDateString() : 'TBD'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">5 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rental Fee:</span>
            <span className="font-medium">ETB {order.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Security Deposit:</span>
            <span className="font-medium">
              ETB {order.rentalData?.depositAmount?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-medium">Total Due:</span>
            <span className="font-bold">
              ETB {(order.totalAmount + (order.rentalData?.depositAmount || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <h4 className="font-medium text-foreground">Pickup Schedule</h4>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">
              {order.rentalData?.startDate ? new Date(order.rentalData.startDate).toLocaleDateString() : 'TBD'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">10:00 AM - 6:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">Your Store</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Confirm Booking
      </button>
    </div>
  );
}

// Stage 4: Rental Details
function RentalDetailsStage({ order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Add specific rental details, care instructions, and special requests.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Included Items</label>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>{order.products?.[0]?.name || 'Unknown Item'}</li>
            <li>Garment bag</li>
            <li>Hanger</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Care Instructions</label>
          <div className="text-sm text-muted-foreground space-y-1 bg-slate-50 p-3 rounded-lg">
            <p>• Dry clean only</p>
            <p>• Do not bleach</p>
            <p>• Iron on low heat</p>
            <p>• Store in garment bag when not in use</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Special Requests</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            rows={3}
            placeholder="Any special requests from the customer..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Seller Notes</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            rows={3}
            placeholder="Add notes for yourself..."
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Save Details & Continue
      </button>
    </div>
  );
}

// Stage 5: Rental Agreement
function RentalAgreementStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Present rental terms and get customer acknowledgement.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 max-h-64 overflow-y-auto">
        <h4 className="font-medium text-foreground mb-3">Rental Terms & Conditions</h4>
        <div className="text-sm text-muted-foreground space-y-3">
          <p><strong>1. Rental Period:</strong> The rental period is from the start date to the end date specified in the booking confirmation.</p>
          <p><strong>2. Security Deposit:</strong> A security deposit is required and will be refunded upon return of the item in good condition.</p>
          <p><strong>3. Care of Item:</strong> The renter agrees to take reasonable care of the item and follow all care instructions provided.</p>
          <p><strong>4. Late Returns:</strong> Late returns may incur additional charges. Please contact us if you need to extend your rental.</p>
          <p><strong>5. Damage:</strong> The renter is responsible for any damage beyond normal wear and tear.</p>
          <p><strong>6. Loss:</strong> If the item is lost or stolen, the renter is responsible for the full replacement cost.</p>
          <p><strong>7. Cancellation:</strong> Cancellations must be made at least 48 hours before the rental start date for a full refund.</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="agreement"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
        />
        <label htmlFor="agreement" className="text-sm text-muted-foreground">
          I have read and agree to the rental terms and conditions above.
        </label>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!agreed}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Agreement
      </button>
    </div>
  );
}

// Stage 6: Item Preparation
function ItemPreparationStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [checklist, setChecklist] = useState({
    cleaning: false,
    ironing: false,
    qualityCheck: false,
    packaging: false,
  });

  const allComplete = checklist.cleaning && checklist.ironing && checklist.qualityCheck && checklist.packaging;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Prepare the item for pickup using the preparation checklist.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Preparation Checklist</h4>
        
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={checklist.cleaning}
            onChange={(e) => setChecklist({ ...checklist, cleaning: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Cleaning</p>
            <p className="text-xs text-muted-foreground">Item has been professionally cleaned</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={checklist.ironing}
            onChange={(e) => setChecklist({ ...checklist, ironing: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Ironing/Steaming</p>
            <p className="text-xs text-muted-foreground">Item has been properly pressed</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={checklist.qualityCheck}
            onChange={(e) => setChecklist({ ...checklist, qualityCheck: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Quality Check</p>
            <p className="text-xs text-muted-foreground">Item inspected for defects or damage</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={checklist.packaging}
            onChange={(e) => setChecklist({ ...checklist, packaging: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Packaging</p>
            <p className="text-xs text-muted-foreground">Item packed in garment bag with accessories</p>
          </div>
        </label>
      </div>

      <div className={`rounded-lg p-4 ${allComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <p className={`text-sm ${allComplete ? 'text-green-800' : 'text-yellow-800'}`}>
          {allComplete ? '✅ Preparation complete!' : '⚠️ Complete all checklist items to continue'}
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!allComplete}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Preparation
      </button>
    </div>
  );
}

// Stage 7: Pickup
function PickupStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Document item condition at pickup and confirm handover.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Pickup Checklist</h4>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Customer ID Verified</p>
            <p className="text-xs text-muted-foreground">Customer identity confirmed</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Condition Photos Taken</p>
            <p className="text-xs text-muted-foreground">Before photos documented</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Item Handover Confirmed</p>
            <p className="text-xs text-muted-foreground">Customer received the item</p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Pickup Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          rows={3}
          placeholder="Add any notes about the pickup..."
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Confirm Pickup
      </button>
    </div>
  );
}

// Stage 8: Rental Active
function RentalActiveStage({ order, onNext }: { order: Order; onNext: () => void }) {
  const startDate = order.rentalData?.startDate ? new Date(order.rentalData.startDate) : new Date();
  const endDate = order.rentalData?.endDate ? new Date(order.rentalData.endDate) : new Date();
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = totalDays - daysRemaining;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Monitor active rental period and track return timeline.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Rental Timeline</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Start Date:</span>
            <span className="font-medium">{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">End Date:</span>
            <span className="font-medium">{endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Duration:</span>
            <span className="font-medium">{totalDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Days Elapsed:</span>
            <span className="font-medium">{daysElapsed} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Days Remaining:</span>
            <span className={`font-medium ${daysRemaining <= 2 ? 'text-red-600' : 'text-green-600'}`}>
              {daysRemaining} days
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Progress</h4>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all"
            style={{ width: `${(daysElapsed / totalDays) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {Math.round((daysElapsed / totalDays) * 100)}% complete
        </p>
      </div>

      {daysRemaining <= 2 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Return date approaching! Customer should be reminded to return the item on time.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Proceed to Return
      </button>
    </div>
  );
}

// Stage 9: Extension Request
function ExtensionRequestStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [hasRequest, _setHasRequest] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Review and approve or reject customer extension requests.
        </p>
      </div>

      {!hasRequest ? (
        <div className="rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-sm text-muted-foreground">No pending extension requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-medium text-foreground mb-3">Extension Request</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested Days:</span>
                <span className="font-medium">3 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New End Date:</span>
                <span className="font-medium">July 13, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional Fee:</span>
                <span className="font-medium">ETB 900</span>
              </div>
            </div>
          </div>

          {!decision ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                Approve Extension
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                Reject Request
              </button>
            </div>
          ) : (
            <div className={`rounded-lg p-4 ${decision === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm ${decision === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                {decision === 'approved' ? '✅ Extension approved!' : '❌ Extension rejected'}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Continue
      </button>
    </div>
  );
}

// Stage 10: Return
function ReturnStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Document item return and verify condition.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Return Checklist</h4>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Item Received</p>
            <p className="text-xs text-muted-foreground">Item returned by customer</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">All Accessories Present</p>
            <p className="text-xs text-muted-foreground">Hanger, garment bag, etc.</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-foreground">Return Photos Taken</p>
            <p className="text-xs text-muted-foreground">After photos documented</p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Return Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          rows={3}
          placeholder="Add any notes about the return..."
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Confirm Return
      </button>
    </div>
  );
}

// Stage 11: Inspection
function InspectionStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Inspect returned item for damage, cleaning needs, and missing items.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Item Condition</label>
        <div className="grid grid-cols-2 gap-2">
          {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => setCondition(cond)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                condition === cond
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cond.charAt(0).toUpperCase() + cond.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
          <span className="text-sm text-foreground">Missing Accessories</span>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
          <span className="text-sm text-foreground">Cleaning Required</span>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
          <span className="text-sm text-foreground">Repair Required</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Inspection Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          rows={3}
          placeholder="Detailed inspection notes..."
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Complete Inspection
      </button>
    </div>
  );
}

// Stage 12: Damage Report
function DamageReportStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  const [hasDamage, setHasDamage] = useState(false);
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Document any damage found during inspection.
        </p>
      </div>

      <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={hasDamage}
          onChange={(e) => setHasDamage(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-sm font-medium text-foreground">Damage Detected</span>
      </label>

      {hasDamage && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Damage Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              rows={3}
              placeholder="Describe the damage..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Damage Photos</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground">Click to upload photos</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Repair Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              rows={2}
              placeholder="Repair requirements..."
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Continue
      </button>
    </div>
  );
}

// Stage 13: Rental History
function RentalHistoryStage({ order: _order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> View rental history and condition tracking for this item.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Previous Rentals</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-muted-foreground">June 2025</span>
            <span className="text-green-600">Excellent condition</span>
          </div>
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-muted-foreground">March 2025</span>
            <span className="text-green-600">Excellent condition</span>
          </div>
          <div className="flex justify-between p-2 bg-slate-50 rounded">
            <span className="text-muted-foreground">January 2025</span>
            <span className="text-yellow-600">Minor cleaning needed</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Current Rental Timeline</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">Booking Request</span>
            <span className="ml-auto text-xs text-slate-500">Jun 30</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">Booking Confirmed</span>
            <span className="ml-auto text-xs text-slate-500">Jun 30</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">Item Prepared</span>
            <span className="ml-auto text-xs text-slate-500">Jul 4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-foreground font-medium">Pickup</span>
            <span className="ml-auto text-xs text-slate-500">Jul 5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-300 rounded-full" />
            <span className="text-muted-foreground">Return</span>
            <span className="ml-auto text-xs text-slate-500">Jul 10</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Complete Rental
      </button>
    </div>
  );
}

// Stage 14: Completion
function RentalCompletionStage({ order, onNext }: { order: Order; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> Final summary and archive the rental into history.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Final Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item:</span>
            <span className="font-medium">{order.products?.[0]?.name || 'Unknown Item'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rental Period:</span>
            <span className="font-medium">5 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Collected:</span>
            <span className="font-medium">ETB {(order.totalAmount + (order.rentalData?.depositAmount || 0)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit Refunded:</span>
            <span className="font-medium text-green-600">ETB {(order.rentalData?.depositAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-medium text-foreground mb-3">Workflow Timeline</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Booking Request</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Availability Check</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Booking Confirmation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Rental Details</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Rental Agreement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Item Preparation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Rental Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Return</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Damage Report</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Rental History</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-500">→</span>
            <span className="font-medium">Completion</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-lg font-semibold text-green-800 mb-2">🎉 Rental Complete!</p>
        <p className="text-sm text-green-700">This rental has been archived into history.</p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Archive & Close
      </button>
    </div>
  );
}

// Workflow Step Component
function WorkflowStep({
  title,
  status,
  description,
}: {
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  description: string;
}) {
  const statusColors = {
    completed: 'bg-green-500',
    in_progress: 'bg-orange-500',
    pending: 'bg-slate-300',
  };

  const statusTextColors = {
    completed: 'text-green-700',
    in_progress: 'text-orange-700',
    pending: 'text-slate-500',
  };

  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 h-3 w-3 rounded-full ${statusColors[status]}`}
        aria-label={`Status: ${status}`}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">{title}</p>
          <span className={`text-xs font-medium ${statusTextColors[status]}`}>
            {status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Badge, Button, Card, CardContent, Drawer, Select } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';

// ─── Types ─────────────────────────────────────────────────────────────────

type OrderModel = 'sale' | 'rental' | 'custom';

type OrderStatus = 'requested' | 'approved' | 'in_progress' | 'completed' | 'returned' | 'cancelled';

interface Order {
  id: string;
  model: OrderModel;
  status: OrderStatus;
  title: string;
  customerName: string;
  price?: number;
  deposit?: number;
  rentalDates?: { start: string; end: string };
  customMilestone?: 'measurements_received' | 'fabric_cutting' | 'tailoring' | 'ready';
  createdAt: string;
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

// ─── Components ─────────────────────────────────────────────────────────────

function ModelBadge({ model }: { model: OrderModel }) {
  const config = {
    sale: { color: 'bg-blue-100 text-blue-700', icon: <IconSale />, label: 'Sale' },
    rental: { color: 'bg-purple-100 text-purple-700', icon: <IconRental />, label: 'Rental' },
    custom: { color: 'bg-orange-100 text-orange-700', icon: <IconCustom />, label: 'Custom' },
  };
  const { color, icon, label } = config[model];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<OrderStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    requested: 'info',
    approved: 'success',
    in_progress: 'warning',
    completed: 'success',
    returned: 'success',
    cancelled: 'error',
  };
  const labels: Record<OrderStatus, string> = {
    requested: 'Requested',
    approved: 'Approved',
    in_progress: 'In Progress',
    completed: 'Completed',
    returned: 'Returned',
    cancelled: 'Cancelled',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function CustomMilestoneTracker({ milestone }: { milestone?: Order['customMilestone'] }) {
  const steps = [
    { key: 'measurements_received', label: 'Measurements' },
    { key: 'fabric_cutting', label: 'Fabric Cutting' },
    { key: 'tailoring', label: 'Tailoring' },
    { key: 'ready', label: 'Ready' },
  ] as const;

  const currentIndex = milestone ? steps.findIndex(s => s.key === milestone) : -1;

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              index <= currentIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function OrderCard({ order, onSelect }: { order: Order; onSelect: (order: Order) => void }) {
  return (
    <Card
      className="hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => onSelect(order)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <ModelBadge model={order.model} />
          <StatusBadge status={order.status} />
        </div>
        <h4 className="font-medium mb-1">{order.title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{order.customerName}</p>
        
        {order.price && (
          <p className="text-sm font-medium">{order.price.toLocaleString()} ETB</p>
        )}
        
        {order.model === 'rental' && order.rentalDates && (
          <p className="text-xs text-muted-foreground mt-1">
            {order.rentalDates.start} → {order.rentalDates.end}
          </p>
        )}
        
        {order.model === 'custom' && (
          <div className="mt-3">
            <CustomMilestoneTracker milestone={order.customMilestone} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderDetailDrawer({ order, onClose, onStatusUpdate }: { order: Order; onClose: () => void; onStatusUpdate: (orderId: string, status: OrderStatus) => void }) {
  const statusOptions = [
    { value: 'requested', label: 'Requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'returned', label: 'Returned' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusUpdate(order.id, e.target.value as OrderStatus);
  };

  return (
    <Drawer open={true} onClose={onClose} title={order.title}>
      <div className="space-y-6 p-2">
        {/* Model & Status */}
        <div className="flex items-center gap-3">
          <ModelBadge model={order.model} />
          <StatusBadge status={order.status} />
        </div>

        {/* Customer Info */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Customer</h4>
          <p className="text-sm text-muted-foreground">{order.customerName}</p>
        </div>

        {/* Pricing */}
        {order.price && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Price</h4>
            <p className="text-sm font-medium">{order.price.toLocaleString()} ETB</p>
          </div>
        )}

        {/* Deposit (Rentals) */}
        {order.model === 'rental' && order.deposit && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Security Deposit</h4>
            <p className="text-sm font-medium">{order.deposit.toLocaleString()} ETB</p>
          </div>
        )}

        {/* Rental Dates */}
        {order.model === 'rental' && order.rentalDates && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Rental Period</h4>
            <p className="text-sm text-muted-foreground">
              {order.rentalDates.start} → {order.rentalDates.end}
            </p>
          </div>
        )}

        {/* Custom Milestones */}
        {order.model === 'custom' && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Production Milestones</h4>
            <CustomMilestoneTracker milestone={order.customMilestone} />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <label className="text-sm font-medium mb-2 block">Update Status</label>
            <Select
              value={order.status}
              onChange={handleStatusChange}
              options={statusOptions}
              className="w-full"
            />
          </div>

          {order.model === 'rental' && (
            <Button variant="outline" className="w-full">
              Log Pre-Handover Condition
            </Button>
          )}

          {order.model === 'rental' && order.status === 'in_progress' && (
            <Button variant="outline" className="w-full">
              Handle Extension Request
            </Button>
          )}

          {(order.model === 'rental' || order.model === 'sale') && (
            <Button variant="outline" className="w-full">
              Generate Handover Agreement
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const [filter, setFilter] = useState<'all' | 'sale' | 'rental' | 'custom'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data - replace with actual API calls
  const orders: Order[] = [
    {
      id: '1',
      model: 'sale',
      status: 'approved',
      title: 'Traditional Habesha Kemis',
      customerName: 'Abebe Kebede',
      price: 3500,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      model: 'rental',
      status: 'in_progress',
      title: 'Ethiopian Gabi - White Cotton',
      customerName: 'Tigist Haile',
      price: 200,
      deposit: 500,
      rentalDates: { start: '2026-08-01', end: '2026-08-04' },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      model: 'custom',
      status: 'in_progress',
      title: 'Custom Netela with Embroidery',
      customerName: 'Dawit Abebe',
      price: 1200,
      customMilestone: 'tailoring',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      model: 'sale',
      status: 'requested',
      title: 'Modern Dress with Ethiopian Patterns',
      customerName: 'Sara Tekle',
      price: 1800,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.model === filter);

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    // API call to update status
    console.log('Update status:', orderId, status);
  };

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your orders.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Orders & Requests Pipeline</h1>
        <p className="text-muted-foreground">Manage sales, rentals, and custom orders in one place.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'sale', 'rental', 'custom'] as const).map((model) => (
          <button
            key={model}
            type="button"
            onClick={() => setFilter(model)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === model
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {model === 'all' ? 'All Orders' : model.charAt(0).toUpperCase() + model.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No orders found for this filter.
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

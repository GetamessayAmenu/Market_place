'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, CardContent, Drawer, Select, Alert } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { apiGet, apiPost } from '../../../lib/api';

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

function TypeBadge({ type }: { type: OrderType }) {
  const config = {
    SALE: { color: 'bg-blue-100 text-blue-700', icon: <IconSale />, label: 'Sale' },
    RENTAL: { color: 'bg-purple-100 text-purple-700', icon: <IconRental />, label: 'Rental' },
    CUSTOM_TAILORING: { color: 'bg-orange-100 text-orange-700', icon: <IconCustom />, label: 'Custom Tailoring' },
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

function TailoringMilestoneTracker({ status }: { status: OrderStatus }) {
  const steps = [
    { key: 'APPROVED_RESERVED', label: 'Approved' },
    { key: 'MEASUREMENTS_SUBMITTED', label: 'Measurements' },
    { key: 'FABRIC_CUTTING', label: 'Fabric Cut' },
    { key: 'TAILORING_IN_PROGRESS', label: 'Tailoring' },
    { key: 'FITTING_READY', label: 'Fitting Ready' },
    { key: 'READY_FOR_HANDOVER', label: 'Ready' },
  ] as const;

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center min-w-fit">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                index <= currentIndex ? 'bg-brand-wine text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-[10px] mt-1 ${
              index <= currentIndex ? 'text-brand-wine font-medium' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 min-w-[20px] ${index < currentIndex ? 'bg-brand-wine' : 'bg-muted'}`} />
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
          <TypeBadge type={order.type} />
          <StatusBadge status={order.status} />
        </div>
        <h4 className="font-medium mb-1">{order.product.title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{order.buyer.displayName}</p>
        
        <p className="text-sm font-medium">{order.agreedPrice.toLocaleString()} {order.product.currency}</p>
        
        {order.type === 'RENTAL' && order.rentalStartDate && order.rentalEndDate && (
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(order.rentalStartDate).toLocaleDateString()} → {new Date(order.rentalEndDate).toLocaleDateString()}
          </p>
        )}
        
        {order.type === 'CUSTOM_TAILORING' && (
          <div className="mt-3">
            <TailoringMilestoneTracker status={order.status} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderDetailDrawer({ order, onClose, onStatusUpdate, onSendQuote, onLogCondition, onCompleteInspection, onGenerateAgreement }: { order: Order; onClose: () => void; onStatusUpdate: (orderId: string, status: OrderStatus) => void; onSendQuote: (order: Order) => void; onLogCondition: (order: Order) => void; onCompleteInspection: (order: Order) => void; onGenerateAgreement: (order: Order) => void }) {
  const customStatusOptions = [
    { value: 'INQUIRY_PENDING', label: 'Pending Inquiry' },
    { value: 'QUOTE_PROPOSED', label: 'Quote Proposed' },
    { value: 'APPROVED_RESERVED', label: 'Approved / Reserved' },
    { value: 'MEASUREMENTS_SUBMITTED', label: 'Measurements Submitted' },
    { value: 'FABRIC_CUTTING', label: 'Fabric Cutting' },
    { value: 'TAILORING_IN_PROGRESS', label: 'Tailoring in Progress' },
    { value: 'FITTING_READY', label: 'Ready for Fitting' },
    { value: 'READY_FOR_HANDOVER', label: 'Ready for Handover' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const rentalStatusOptions = [
    { value: 'INQUIRY_PENDING', label: 'Pending Inquiry' },
    { value: 'QUOTE_PROPOSED', label: 'Quote Proposed' },
    { value: 'APPROVED_RESERVED', label: 'Approved / Reserved' },
    { value: 'HANDOVER_PENDING_DEPOSIT', label: 'Handover Pending' },
    { value: 'RENTAL_ACTIVE', label: 'Rental Active' },
    { value: 'RETURN_INITIATED', label: 'Return Initiated' },
    { value: 'RETURNED_INSPECTED', label: 'Returned & Inspected' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const saleStatusOptions = [
    { value: 'INQUIRY_PENDING', label: 'Pending Inquiry' },
    { value: 'QUOTE_PROPOSED', label: 'Quote Proposed' },
    { value: 'APPROVED_RESERVED', label: 'Approved / Reserved' },
    { value: 'READY_FOR_HANDOVER', label: 'Ready for Handover' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const statusOptions = order.type === 'CUSTOM_TAILORING' 
    ? customStatusOptions 
    : order.type === 'RENTAL' 
    ? rentalStatusOptions 
    : saleStatusOptions;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusUpdate(order.id, e.target.value as OrderStatus);
  };

  return (
    <Drawer open={true} onClose={onClose} title={order.product.title}>
      <div className="space-y-6 p-2">
        {/* Type & Status */}
        <div className="flex items-center gap-3">
          <TypeBadge type={order.type} />
          <StatusBadge status={order.status} />
        </div>

        {/* Order Number */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Order Number</h4>
          <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
        </div>

        {/* Customer Info */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Customer</h4>
          <p className="text-sm text-muted-foreground">{order.buyer.displayName}</p>
          {order.buyer.email && <p className="text-xs text-muted-foreground">{order.buyer.email}</p>}
          {order.buyer.phone && <p className="text-xs text-muted-foreground">{order.buyer.phone}</p>}
        </div>

        {/* Pricing */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Agreed Price</h4>
          <p className="text-sm font-medium">{order.agreedPrice.toLocaleString()} {order.product.currency}</p>
        </div>

        {/* Deposit (Rentals) */}
        {order.type === 'RENTAL' && order.agreedDeposit && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Security Deposit</h4>
            <p className="text-sm font-medium">{order.agreedDeposit.toLocaleString()} {order.product.currency}</p>
            <p className="text-xs text-muted-foreground">
              {order.offlineDepositRefunded ? '✓ Refunded' : 'Pending refund'}
            </p>
          </div>
        )}

        {/* Rental Dates */}
        {order.type === 'RENTAL' && order.rentalStartDate && order.rentalEndDate && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Rental Period</h4>
            <p className="text-sm text-muted-foreground">
              {new Date(order.rentalStartDate).toLocaleDateString()} → {new Date(order.rentalEndDate).toLocaleDateString()}
            </p>
            {order.extensionDaysRequested > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Extension: {order.extensionDaysRequested} days ({order.extensionApproved === true ? 'Approved' : order.extensionApproved === false ? 'Declined' : 'Pending'})
              </p>
            )}
          </div>
        )}

        {/* Custom Tailoring Milestones */}
        {order.type === 'CUSTOM_TAILORING' && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Production Milestones</h4>
            <TailoringMilestoneTracker status={order.status} />
          </div>
        )}

        {/* Fitting Date (Custom) */}
        {order.type === 'CUSTOM_TAILORING' && order.fittingDate && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Fitting Date</h4>
            <p className="text-sm text-muted-foreground">{new Date(order.fittingDate).toLocaleDateString()}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t">
          {order.status === 'INQUIRY_PENDING' && (
            <Button onClick={() => onSendQuote(order)} className="w-full">
              Send Custom Quote
            </Button>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Update Status</label>
            <Select
              value={order.status}
              onChange={handleStatusChange}
              options={statusOptions}
              className="w-full"
            />
          </div>

          {order.type === 'RENTAL' && (
            <Button variant="outline" onClick={() => onLogCondition(order)} className="w-full">
              Log Pre-Handover Condition
            </Button>
          )}

          {order.type === 'RENTAL' && order.extensionDaysRequested > 0 && order.extensionApproved === null && (
            <Button variant="outline" className="w-full">
              Handle Extension Request
            </Button>
          )}

          {(order.type === 'RENTAL' || order.type === 'SALE') && (
            <Button variant="outline" onClick={() => onGenerateAgreement(order)} className="w-full">
              Generate Handover Agreement
            </Button>
          )}

          {order.type === 'RENTAL' && order.status === 'RETURNED_INSPECTED' && (
            <Button variant="outline" onClick={() => onCompleteInspection(order)} className="w-full">
              Complete Inspection
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Agreement Summary Modal ─────────────────────────────────────────────────────

function AgreementSummaryModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF or image download
    console.log('Download agreement for order:', order.orderNumber);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Handover Agreement</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="border rounded-lg p-6 space-y-4 bg-gray-50">
          <div className="text-center border-b pb-4">
            <h4 className="font-bold text-xl">SALE / RENTAL AGREEMENT</h4>
            <p className="text-sm text-muted-foreground mt-1">Order: {order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-sm mb-2">Seller Information</h5>
              <p className="text-sm">{order.seller.displayName}</p>
              <p className="text-sm text-muted-foreground">{order.seller.email}</p>
              {order.seller.phone && <p className="text-sm text-muted-foreground">{order.seller.phone}</p>}
              {order.seller.location && <p className="text-sm text-muted-foreground">{order.seller.location}</p>}
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-2">Buyer Information</h5>
              <p className="text-sm">{order.buyer.displayName}</p>
              <p className="text-sm text-muted-foreground">{order.buyer.email}</p>
              {order.buyer.phone && <p className="text-sm text-muted-foreground">{order.buyer.phone}</p>}
              {order.buyer.location && <p className="text-sm text-muted-foreground">{order.buyer.location}</p>}
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-sm mb-2">Item Details</h5>
            <p className="text-sm font-medium">{order.product.title}</p>
            <p className="text-sm text-muted-foreground">Type: {order.type}</p>
            <p className="text-sm text-muted-foreground">Agreed Price: {order.agreedPrice.toLocaleString()} {order.product.currency}</p>
            {order.agreedDeposit && (
              <p className="text-sm text-muted-foreground">Security Deposit: {order.agreedDeposit.toLocaleString()} {order.product.currency}</p>
            )}
          </div>

          {order.type === 'RENTAL' && order.rentalStartDate && order.rentalEndDate && (
            <div>
              <h5 className="font-semibold text-sm mb-2">Rental Period</h5>
              <p className="text-sm text-muted-foreground">
                Start: {new Date(order.rentalStartDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                End: {new Date(order.rentalEndDate).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <h5 className="font-semibold text-sm mb-2">Terms and Conditions</h5>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>The buyer agrees to the agreed price and terms specified above</li>
              <li>The item must be returned in the same condition as received (for rentals)</li>
              <li>Security deposit will be refunded upon satisfactory return (for rentals)</li>
              <li>Any damage beyond normal wear may result in deposit deduction</li>
              <li>Both parties agree to resolve disputes through amicable discussion</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Seller Signature:</p>
              <div className="h-12 border-b border-gray-400"></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Buyer Signature:</p>
              <div className="h-12 border-b border-gray-400"></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            Print
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Return & Inspection Logging Drawer ─────────────────────────────────────────────

function ReturnInspectionDrawer({ order, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (data: any) => void }) {
  const [condition, setCondition] = useState<'good' | 'damaged'>('good');
  const [damageNotes, setDamageNotes] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');

  const handleSubmit = () => {
    onSubmit({
      condition,
      damageNotes: condition === 'damaged' ? damageNotes : undefined,
      deductionAmount: condition === 'damaged' ? (deductionAmount ? Number(deductionAmount) : undefined) : undefined,
    });
    onClose();
  };

  return (
    <Drawer open={true} onClose={onClose} title="Complete Return Inspection">
      <div className="space-y-6 p-2">
        <div>
          <h4 className="text-sm font-semibold mb-1">Order</h4>
          <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Return Condition</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="good"
                checked={condition === 'good'}
                onChange={(e) => setCondition(e.target.value as 'good' | 'damaged')}
                className="w-4 h-4"
              />
              <span className="text-sm">Good Condition</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="damaged"
                checked={condition === 'damaged'}
                onChange={(e) => setCondition(e.target.value as 'good' | 'damaged')}
                className="w-4 h-4"
              />
              <span className="text-sm">Damaged</span>
            </label>
          </div>
        </div>

        {condition === 'damaged' && (
          <>
            <div>
              <h4 className="text-sm font-semibold mb-2">Damage Description</h4>
              <textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Describe the damage..."
                className="w-full px-3 py-2 border rounded-md min-h-[80px] text-sm"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Deposit Deduction ({order.product.currency})</h4>
              <input
                type="number"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                placeholder="Amount to deduct from deposit"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Security Deposit: {order.agreedDeposit?.toLocaleString() || 0} {order.product.currency}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Complete Inspection
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Pre-Handover Condition Logger Drawer ─────────────────────────────────────────

function PreHandoverConditionDrawer({ order, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (data: any) => void }) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [conditionNotes, setConditionNotes] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const handleAddPhoto = () => {
    if (newPhotoUrl) {
      setPhotoUrls([...photoUrls, newPhotoUrl]);
      setNewPhotoUrl('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit({
      photoUrls,
      conditionNotes,
    });
    onClose();
  };

  return (
    <Drawer open={true} onClose={onClose} title="Log Pre-Handover Condition">
      <div className="space-y-6 p-2">
        <div>
          <h4 className="text-sm font-semibold mb-1">Order</h4>
          <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Pre-Handover Photos</h4>
          <p className="text-xs text-muted-foreground mb-3">Document the condition of the item before handover</p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Enter photo URL"
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button onClick={handleAddPhoto} size="sm">
              Add
            </Button>
          </div>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Condition photo ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Condition Notes</h4>
          <textarea
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            placeholder="Describe the current condition of the item..."
            className="w-full px-3 py-2 border rounded-md min-h-[100px] text-sm"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={photoUrls.length === 0}>
            Save & Continue
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Custom Quote Builder Modal ───────────────────────────────────────────────

function CustomQuoteModal({ order, onClose, onSubmit }: { order: Order; onClose: () => void; onSubmit: (data: any) => void }) {
  const [proposedPrice, setProposedPrice] = useState(order.agreedPrice);
  const [proposedDeposit, setProposedDeposit] = useState(order.agreedDeposit || 0);
  const [estimatedLeadTimeDays, setEstimatedLeadTimeDays] = useState('');
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [embroideryPattern, setEmbroideryPattern] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      proposedPrice,
      proposedDeposit: proposedDeposit || undefined,
      estimatedLeadTimeDays: estimatedLeadTimeDays ? parseInt(estimatedLeadTimeDays) : undefined,
      customizationNotes,
      fabricType,
      embroideryPattern,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold mb-4">Send Custom Quote</h3>
        <p className="text-sm text-muted-foreground mb-4">Order: {order.orderNumber}</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Proposed Price ({order.product.currency})</label>
            <input
              type="number"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Security Deposit ({order.product.currency})</label>
            <input
              type="number"
              value={proposedDeposit}
              onChange={(e) => setProposedDeposit(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Estimated Lead Time (days)</label>
            <input
              type="number"
              value={estimatedLeadTimeDays}
              onChange={(e) => setEstimatedLeadTimeDays(e.target.value)}
              placeholder="e.g., 7"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Customization Notes</label>
            <textarea
              value={customizationNotes}
              onChange={(e) => setCustomizationNotes(e.target.value)}
              placeholder="Describe any customizations..."
              className="w-full px-3 py-2 border rounded-md min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Fabric Type</label>
            <input
              type="text"
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
              placeholder="e.g., Cotton, Silk, Menen fabric"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Embroidery Pattern</label>
            <input
              type="text"
              value={embroideryPattern}
              onChange={(e) => setEmbroideryPattern(e.target.value)}
              placeholder="e.g., Tibeb, Cross-stitch"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other details..."
              className="w-full px-3 py-2 border rounded-md min-h-[60px]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Send Quote
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Pipeline View ─────────────────────────────────────────────────────

function KanbanView({ orders, onSelect }: { orders: Order[]; onSelect: (order: Order) => void }) {
  const columns = [
    { id: 'INQUIRY_PENDING', label: 'Pending Inquiry', color: 'bg-blue-50 border-blue-200' },
    { id: 'QUOTE_PROPOSED', label: 'Quote Proposed', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'APPROVED_RESERVED', label: 'Approved / Reserved', color: 'bg-green-50 border-green-200' },
    { id: 'READY_FOR_HANDOVER', label: 'Ready for Handover', color: 'bg-purple-50 border-purple-200' },
    { id: 'RENTAL_ACTIVE', label: 'Rental Active', color: 'bg-orange-50 border-orange-200' },
    { id: 'COMPLETED', label: 'Completed', color: 'bg-gray-50 border-gray-200' },
  ];

  const getOrdersForColumn = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className={`min-w-[280px] flex-shrink-0 rounded-lg border p-4 ${column.color}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">{column.label}</h4>
            <Badge variant="outline" className="text-xs">
              {getOrdersForColumn(column.id).length}
            </Badge>
          </div>
          <div className="space-y-3">
            {getOrdersForColumn(column.id).map((order) => (
              <Card
                key={order.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onSelect(order)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeBadge type={order.type} />
                  </div>
                  <p className="text-sm font-medium truncate">{order.product.title}</p>
                  <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                  <p className="text-sm font-medium mt-1">{order.agreedPrice.toLocaleString()} {order.product.currency}</p>
                </CardContent>
              </Card>
            ))}
            {getOrdersForColumn(column.id).length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No orders
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const [filter, setFilter] = useState<'all' | 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [quoteModalOrder, setQuoteModalOrder] = useState<Order | null>(null);
  const [conditionDrawerOrder, setConditionDrawerOrder] = useState<Order | null>(null);
  const [inspectionDrawerOrder, setInspectionDrawerOrder] = useState<Order | null>(null);
  const [agreementModalOrder, setAgreementModalOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        console.log('Fetching orders for seller:', user.id);
        const response = await apiGet<any>('/orders/seller', { _t: Date.now() });
        console.log('Orders API response:', response);
        console.log('Response type:', typeof response, 'Is array:', Array.isArray(response));
        
        // Handle different response structures
        let ordersArray = [];
        if (Array.isArray(response)) {
          ordersArray = response;
        } else if (response && Array.isArray(response.data)) {
          ordersArray = response.data;
        } else if (response && Array.isArray(response.items)) {
          ordersArray = response.items;
        } else if (response && response.data && Array.isArray(response.data.items)) {
          ordersArray = response.data.items;
        } else if (response && response.data && typeof response.data === 'object') {
          console.log('Inner data object keys:', Object.keys(response.data));
          console.log('Inner data object:', response.data);
        }
        
        console.log('Orders array length:', ordersArray.length);
        setOrders(ordersArray);
      } catch (err: any) {
        console.error('Failed to load orders:', err);
        console.error('Error details:', err.response?.data, err.message);
        if (err.response?.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view orders.');
        } else if (err.response?.status === 404) {
          setError('Orders endpoint not found. API may be unavailable.');
        } else {
          setError(`Failed to load orders: ${err.message || 'Unknown error'}`);
        }
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, [user]);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.type === filter);

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    console.log('Update status:', orderId, status);
  };

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to view your orders.
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

  if (error) {
    return (
      <Alert variant="error" className="max-w-md mx-auto mt-8">
        {error}
      </Alert>
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
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'SALE', 'RENTAL', 'CUSTOM_TAILORING'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {type === 'all' ? 'All Orders' : 
             type === 'CUSTOM_TAILORING' ? 'Custom Tailoring' :
             type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      {/* Orders View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
          ))}
        </div>
      ) : (
        <KanbanView orders={filteredOrders} onSelect={setSelectedOrder} />
      )}

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
          onSendQuote={setQuoteModalOrder}
          onLogCondition={setConditionDrawerOrder}
          onCompleteInspection={setInspectionDrawerOrder}
          onGenerateAgreement={setAgreementModalOrder}
        />
      )}

      {/* Custom Quote Modal */}
      {quoteModalOrder && (
        <CustomQuoteModal
          order={quoteModalOrder}
          onClose={() => setQuoteModalOrder(null)}
          onSubmit={async (data) => {
            try {
              await apiPost(`/orders/${quoteModalOrder.id}/quotes`, data);
              // Refresh orders
              const response = await apiGet<any>('/orders/seller', { _t: Date.now() });
              setOrders(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
              console.error('Failed to send quote:', err);
            }
          }}
        />
      )}

      {/* Pre-Handover Condition Drawer */}
      {conditionDrawerOrder && (
        <PreHandoverConditionDrawer
          order={conditionDrawerOrder}
          onClose={() => setConditionDrawerOrder(null)}
          onSubmit={async (data) => {
            try {
              await apiPost(`/orders/${conditionDrawerOrder.id}/pre-handover-photos`, data);
              // Refresh orders
              const response = await apiGet<any>('/orders/seller', { _t: Date.now() });
              setOrders(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
              console.error('Failed to log condition:', err);
            }
          }}
        />
      )}

      {/* Return & Inspection Drawer */}
      {inspectionDrawerOrder && (
        <ReturnInspectionDrawer
          order={inspectionDrawerOrder}
          onClose={() => setInspectionDrawerOrder(null)}
          onSubmit={async (data) => {
            try {
              await apiPost(`/orders/${inspectionDrawerOrder.id}/complete-inspection`, data);
              // Refresh orders
              const response = await apiGet<any>('/orders/seller', { _t: Date.now() });
              setOrders(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
              console.error('Failed to complete inspection:', err);
            }
          }}
        />
      )}

      {/* Agreement Summary Modal */}
      {agreementModalOrder && (
        <AgreementSummaryModal
          order={agreementModalOrder}
          onClose={() => setAgreementModalOrder(null)}
        />
      )}
    </div>
  );
}

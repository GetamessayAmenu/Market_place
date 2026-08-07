'use client';

import { Card, CardContent, Button } from '@marketplace/ui';

type OrderType = 'SALE' | 'RENTAL' | 'CUSTOM_TAILORING';
type OrderStatus = 'INQUIRY_PENDING' | 'QUOTE_PROPOSED' | 'APPROVED_RESERVED' | 'READY_FOR_HANDOVER' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'MEASUREMENTS_SUBMITTED' | 'FABRIC_CUTTING' | 'TAILORING_IN_PROGRESS' | 'FITTING_READY' | 'HANDOVER_PENDING_DEPOSIT' | 'RENTAL_ACTIVE' | 'RETURN_INITIATED' | 'RETURNED_INSPECTED';

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: OrderStatus[];
  actionLabel?: string;
  actionValue?: OrderStatus;
}

interface OrderWorkflowProps {
  type: OrderType;
  currentStatus: OrderStatus;
  onAction?: (action: OrderStatus) => void;
}

const SALE_WORKFLOW: WorkflowStep[] = [
  {
    id: 'inquiry',
    label: 'Inquiry',
    description: 'Buyer sends inquiry about the product',
    status: ['INQUIRY_PENDING'],
  },
  {
    id: 'quote',
    label: 'Quote Proposed',
    description: 'Seller provides pricing quote',
    status: ['QUOTE_PROPOSED'],
    actionLabel: 'Accept Quote',
    actionValue: 'APPROVED_RESERVED' as OrderStatus,
  },
  {
    id: 'approved',
    label: 'Approved & Reserved',
    description: 'Buyer accepts quote and reserves item',
    status: ['APPROVED_RESERVED'],
    actionLabel: 'Mark Ready',
    actionValue: 'READY_FOR_HANDOVER' as OrderStatus,
  },
  {
    id: 'ready',
    label: 'Ready for Handover',
    description: 'Item prepared for pickup/delivery',
    status: ['READY_FOR_HANDOVER'],
    actionLabel: 'Complete Order',
    actionValue: 'COMPLETED' as OrderStatus,
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Transaction successfully completed',
    status: ['COMPLETED'],
  },
];

const RENTAL_WORKFLOW: WorkflowStep[] = [
  {
    id: 'inquiry',
    label: 'Rental Inquiry',
    description: 'Buyer requests rental availability',
    status: ['INQUIRY_PENDING'],
  },
  {
    id: 'quote',
    label: 'Quote Proposed',
    description: 'Seller provides rental quote with deposit',
    status: ['QUOTE_PROPOSED'],
    actionLabel: 'Accept Quote',
    actionValue: 'APPROVED_RESERVED' as OrderStatus,
  },
  {
    id: 'approved',
    label: 'Approved & Reserved',
    description: 'Rental period reserved with deposit',
    status: ['APPROVED_RESERVED'],
    actionLabel: 'Mark Deposit Received',
    actionValue: 'HANDOVER_PENDING_DEPOSIT' as OrderStatus,
  },
  {
    id: 'deposit',
    label: 'Handover Pending Deposit',
    description: 'Security deposit payment required',
    status: ['HANDOVER_PENDING_DEPOSIT'],
    actionLabel: 'Mark Rental Active',
    actionValue: 'RENTAL_ACTIVE' as OrderStatus,
  },
  {
    id: 'active',
    label: 'Rental Active',
    description: 'Rental period in progress',
    status: ['RENTAL_ACTIVE'],
    actionLabel: 'Initiate Return',
    actionValue: 'RETURN_INITIATED' as OrderStatus,
  },
  {
    id: 'return',
    label: 'Return Initiated',
    description: 'Item return process started',
    status: ['RETURN_INITIATED'],
    actionLabel: 'Mark Returned',
    actionValue: 'RETURNED_INSPECTED' as OrderStatus,
  },
  {
    id: 'inspected',
    label: 'Returned & Inspected',
    description: 'Item returned and condition verified',
    status: ['RETURNED_INSPECTED'],
    actionLabel: 'Complete Rental',
    actionValue: 'COMPLETED' as OrderStatus,
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Rental successfully completed',
    status: ['COMPLETED'],
  },
];

const CUSTOM_TAILORING_WORKFLOW: WorkflowStep[] = [
  {
    id: 'inquiry',
    label: 'Custom Inquiry',
    description: 'Buyer requests custom tailoring service',
    status: ['INQUIRY_PENDING'],
  },
  {
    id: 'quote',
    label: 'Quote Proposed',
    description: 'Tailor provides custom work quote',
    status: ['QUOTE_PROPOSED'],
    actionLabel: 'Accept Quote',
    actionValue: 'APPROVED_RESERVED' as OrderStatus,
  },
  {
    id: 'approved',
    label: 'Approved & Reserved',
    description: 'Custom work approved and scheduled',
    status: ['APPROVED_RESERVED'],
    actionLabel: 'Submit Measurements',
    actionValue: 'MEASUREMENTS_SUBMITTED' as OrderStatus,
  },
  {
    id: 'measurements',
    label: 'Measurements Submitted',
    description: 'Buyer provides body measurements',
    status: ['MEASUREMENTS_SUBMITTED'],
    actionLabel: 'Start Cutting',
    actionValue: 'FABRIC_CUTTING' as OrderStatus,
  },
  {
    id: 'cutting',
    label: 'Fabric Cutting',
    description: 'Fabric cutting and preparation',
    status: ['FABRIC_CUTTING'],
    actionLabel: 'Start Tailoring',
    actionValue: 'TAILORING_IN_PROGRESS' as OrderStatus,
  },
  {
    id: 'tailoring',
    label: 'Tailoring in Progress',
    description: 'Custom tailoring work in progress',
    status: ['TAILORING_IN_PROGRESS'],
    actionLabel: 'Ready for Fitting',
    actionValue: 'FITTING_READY' as OrderStatus,
  },
  {
    id: 'fitting',
    label: 'Fitting Ready',
    description: 'Item ready for fitting session',
    status: ['FITTING_READY'],
    actionLabel: 'Mark Ready for Handover',
    actionValue: 'READY_FOR_HANDOVER' as OrderStatus,
  },
  {
    id: 'ready',
    label: 'Ready for Handover',
    description: 'Final adjustments completed',
    status: ['READY_FOR_HANDOVER'],
    actionLabel: 'Complete Order',
    actionValue: 'COMPLETED' as OrderStatus,
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Custom work successfully delivered',
    status: ['COMPLETED'],
  },
];

export function OrderWorkflow({ type, currentStatus, onAction }: OrderWorkflowProps) {
  const workflow = type === 'SALE' 
    ? SALE_WORKFLOW 
    : type === 'RENTAL' 
    ? RENTAL_WORKFLOW 
    : CUSTOM_TAILORING_WORKFLOW;

  const getCurrentStepIndex = () => {
    return workflow.findIndex(step => step.status.includes(currentStatus));
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = currentStatus === 'CANCELLED';
  const isDisputed = currentStatus === 'DISPUTED';

  if (isCancelled) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <div className="h-4 w-4 rounded-full bg-red-600" />
            <div>
              <h3 className="font-semibold">Order Cancelled</h3>
              <p className="text-sm text-muted-foreground">This order has been cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isDisputed) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-orange-600">
            <div className="h-4 w-4 rounded-full bg-orange-600" />
            <div>
              <h3 className="font-semibold">Order Disputed</h3>
              <p className="text-sm text-muted-foreground">This order is currently under dispute review</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">
          {type === 'SALE' ? 'Sales' : type === 'RENTAL' ? 'Rental' : 'Custom Tailoring'} Workflow
        </h3>
        <div className="space-y-4">
          {workflow.map((step, index) => {
            const isCurrentStep = index === currentStepIndex;
            const isPastStep = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  {isPastStep ? (
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  ) : isCurrentStep ? (
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    </div>
                  )}
                  {index < workflow.length - 1 && (
                    <div 
                      className={`w-0.5 h-8 my-1 ${
                        isPastStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isCurrentStep ? 'text-blue-600' : ''}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {isCurrentStep && step.actionLabel && onAction && step.actionValue && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onAction(step.actionValue!)}
                      >
                        {step.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

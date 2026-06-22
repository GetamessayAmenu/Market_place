"use client"
import { cn } from '@marketplace/ui';
import React from 'react';

import type { ListingType } from './ListingTypeSelector';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StepDef {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ListingStepperProps {
  steps: StepDef[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (index: number) => void;
  listingType: ListingType | null;
}

const TYPE_ACCENT: Record<string, string> = {
  sale: 'bg-brand-green text-white',
  rent: 'bg-brand-gold text-white',
  custom: 'bg-brand-wine text-white',
};

function getAccent(type: string | null): { bg: string; cls: string } {
  const fallback = 'bg-brand-green text-white';
  const cls = (type ? TYPE_ACCENT[type] : undefined) ?? fallback;
  return { bg: cls.split(' ')[0] ?? 'bg-primary', cls };
}

// ─── Desktop sidebar stepper ─────────────────────────────────────────────────

function DesktopStepper({ steps, currentStep, completedSteps, onStepClick, listingType }: ListingStepperProps) {
  const accent = getAccent(listingType);

  return (
    <nav className="hidden fashion-lg:block" aria-label="Listing form steps">
      <ol className="space-y-1">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          const isAccessible = isCompleted || index <= currentStep;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => { if (isAccessible) onStepClick(index); }}
                disabled={!isAccessible}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  isActive && 'bg-primary/5',
                  !isActive && isAccessible && 'hover:bg-muted/60 cursor-pointer',
                  !isAccessible && 'cursor-not-allowed opacity-50'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Step indicator */}
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isActive && accent.cls,
                  isCompleted && !isActive && 'bg-primary/10 text-primary',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted && !isActive ? (
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    String(index + 1)
                  )}
                </div>

                {/* Label + description */}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm font-medium leading-tight',
                    isActive ? 'text-foreground' : isAccessible ? 'text-foreground/80' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{step.description}</p>
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="ml-6 border-l border-border pl-6">
                  <div className="h-2" />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Progress */}
      <div className="mt-5 px-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((completedSteps.size) / steps.length) * 100)}% complete</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all duration-300', accent.bg)}
            style={{ width: String(Math.round((completedSteps.size / steps.length) * 100)) + '%' }}
          />
        </div>
      </div>
    </nav>
  );
}

// ─── Mobile horizontal dots ──────────────────────────────────────────────────

function MobileStepper({ steps, currentStep, completedSteps, listingType }: Omit<ListingStepperProps, 'onStepClick'>) {
  const accent = getAccent(listingType);

  return (
    <div className="fashion-lg:hidden">
      <div className="flex items-center justify-center gap-1.5">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          return (
            <button
              key={step.id}
              type="button"
              aria-label={step.label}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'h-2.5 rounded-full transition-all',
                isActive && cn('w-8', accent.cls),
                isCompleted && !isActive && 'w-2.5 bg-primary/40',
                !isActive && !isCompleted && 'w-2.5 bg-muted'
              )}
              disabled
            />
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{steps[currentStep]?.label ?? ''}</span>
        {' '}— Step {currentStep + 1} of {steps.length}
      </p>
    </div>
  );
}

// ─── Combined export ─────────────────────────────────────────────────────────

export default function ListingStepper(props: ListingStepperProps) {
  return (
    <>
      <DesktopStepper {...props} />
      <MobileStepper {...props} />
    </>
  );
}

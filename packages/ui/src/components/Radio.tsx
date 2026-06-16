import React, { forwardRef, useId } from 'react';

import { cn } from '../lib/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  disabled?: boolean;
}

const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ name, options, value, onChange, label, error, orientation = 'vertical', className, disabled }, ref) => {
    const groupId = useId();
    const errorId = error ? `${groupId}-error` : undefined;

    return (
      <fieldset
        ref={ref}
        className={cn('w-full', className)}
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-invalid={!!error}
        aria-describedby={errorId}
        disabled={disabled}
      >
        {label && (
          <legend id={`${groupId}-label`} className="block text-sm font-medium text-foreground mb-2">
            {label}
          </legend>
        )}
        <div
          className={cn(
            'gap-3',
            orientation === 'vertical' ? 'flex flex-col' : 'flex flex-wrap items-center'
          )}
        >
          {options.map((option) => {
            const optionId = `${groupId}-${option.value}`;
            const isChecked = value === option.value;
            const isDisabled = [disabled, option.disabled].some((v) => v === true);

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={cn(
                  'relative flex items-start gap-3 cursor-pointer rounded-md p-2 transition-colors',
                  'hover:bg-muted/50',
                  isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                )}
              >
                <span className="relative flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
                  <input
                    id={optionId}
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={isChecked}
                    onChange={() => { if (!isDisabled) onChange?.(option.value); }}
                    disabled={isDisabled}
                    className="peer sr-only"
                    aria-describedby={option.description ? `${optionId}-desc` : undefined}
                  />
                  <span
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition-colors',
                      'border-input',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                      isChecked && 'border-primary',
                      isDisabled && 'opacity-50'
                    )}
                  />
                  {isChecked && (
                    <span className="absolute h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  {option.description && (
                    <span id={`${optionId}-desc`} className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
        {error && errorId && (
          <p id={errorId} className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

/** Standalone single radio for simple use cases */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  description?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'relative flex items-start gap-3 cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/50',
          props.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
          className
        )}
      >
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
          <input
            ref={ref}
            id={inputId}
            type="radio"
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'h-5 w-5 rounded-full border-2 transition-colors',
              'border-input',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
              'peer-checked:border-primary'
            )}
          />
          <span className="absolute h-2.5 w-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
          )}
        </span>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export { Radio, RadioGroup };

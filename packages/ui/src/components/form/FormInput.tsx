import React, { forwardRef } from 'react';
import { Input } from '../Input.js';
import { FormControl } from './FormControl.js';

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'label' | 'error' | 'helperText'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, helperText, required, id, type, placeholder, disabled, value, onChange, onBlur, onFocus, name, autoComplete, min, max, step, pattern, maxLength, minLength, readOnly, required: inputRequired }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <FormControl {...(label !== undefined && { label })} {...(error !== undefined && { error })} {...(helperText !== undefined && { helperText })} {...(required !== undefined && { required })} {...(inputId !== undefined && { id: inputId })}>
        <Input
          ref={ref}
          id={inputId}
          {...(error !== undefined && { error })}
          className={className}
          {...(type !== undefined && { type })}
          {...(placeholder !== undefined && { placeholder })}
          {...(disabled !== undefined && { disabled })}
          {...(value !== undefined && { value })}
          {...(onChange !== undefined && { onChange })}
          {...(onBlur !== undefined && { onBlur })}
          {...(onFocus !== undefined && { onFocus })}
          {...(name !== undefined && { name })}
          {...(autoComplete !== undefined && { autoComplete })}
          {...(min !== undefined && { min })}
          {...(max !== undefined && { max })}
          {...(step !== undefined && { step })}
          {...(pattern !== undefined && { pattern })}
          {...(maxLength !== undefined && { maxLength })}
          {...(minLength !== undefined && { minLength })}
          {...(readOnly !== undefined && { readOnly })}
          {...(inputRequired !== undefined && { required: inputRequired })}
        />
      </FormControl>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };

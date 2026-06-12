import React, { forwardRef } from 'react';
import { Textarea } from '../Textarea.js';
import { FormControl } from './FormControl.js';

export interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'label' | 'error' | 'helperText'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  autoResize?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, error, helperText, required, autoResize, showCharacterCount, maxLength, id, placeholder, disabled, value, onChange, onBlur, onFocus, name, rows, cols, readOnly, minLength }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <FormControl {...(label !== undefined && { label })} {...(error !== undefined && { error })} {...(helperText !== undefined && { helperText })} {...(required !== undefined && { required })} {...(textareaId !== undefined && { id: textareaId })}>
        <Textarea
          ref={ref}
          id={textareaId}
          {...(error !== undefined && { error })}
          {...(autoResize !== undefined && { autoResize })}
          {...(showCharacterCount !== undefined && { showCharacterCount })}
          {...(maxLength !== undefined && { maxLength })}
          className={className}
          {...(placeholder !== undefined && { placeholder })}
          {...(disabled !== undefined && { disabled })}
          {...(value !== undefined && { value })}
          {...(onChange !== undefined && { onChange })}
          {...(onBlur !== undefined && { onBlur })}
          {...(onFocus !== undefined && { onFocus })}
          {...(name !== undefined && { name })}
          {...(rows !== undefined && { rows })}
          {...(cols !== undefined && { cols })}
          {...(readOnly !== undefined && { readOnly })}
          {...(minLength !== undefined && { minLength })}
        />
      </FormControl>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea };

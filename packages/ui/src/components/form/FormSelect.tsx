import { forwardRef } from 'react';
import { Select, SelectProps } from '../Select.js';
import { FormControl } from './FormControl.js';

export interface FormSelectProps extends Omit<SelectProps, 'label' | 'error' | 'helperText'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, label, error, helperText, required, id, options, placeholder, disabled, value, onChange, onBlur, onFocus, name, autoComplete, multiple }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <FormControl {...(label !== undefined && { label })} {...(error !== undefined && { error })} {...(helperText !== undefined && { helperText })} {...(required !== undefined && { required })} {...(selectId !== undefined && { id: selectId })}>
        <Select
          ref={ref}
          id={selectId}
          {...(error !== undefined && { error })}
          options={options}
          {...(placeholder !== undefined && { placeholder })}
          className={className}
          {...(disabled !== undefined && { disabled })}
          {...(value !== undefined && { value })}
          {...(onChange !== undefined && { onChange })}
          {...(onBlur !== undefined && { onBlur })}
          {...(onFocus !== undefined && { onFocus })}
          {...(name !== undefined && { name })}
          {...(autoComplete !== undefined && { autoComplete })}
          {...(multiple !== undefined && { multiple })}
        />
      </FormControl>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export { FormSelect };

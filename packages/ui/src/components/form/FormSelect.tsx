import { forwardRef } from 'react';

import { Select, type SelectProps } from '../Select';

import { FormControl } from './FormControl';

export interface FormSelectProps extends SelectProps {
  required?: boolean;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, required, id, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? '';

    return (
      <FormControl
        {...(label !== undefined && { label })}
        {...(error !== undefined && { error })}
        {...(helperText !== undefined && { helperText })}
        {...(required !== undefined && { required })}
        htmlFor={selectId}
      >
        <Select ref={ref} id={selectId} {...(error !== undefined && { error })} {...rest} />
      </FormControl>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export { FormSelect };

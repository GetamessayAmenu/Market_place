import { forwardRef } from 'react';

import { Input, type InputProps } from '../Input';

import { FormControl } from './FormControl';

export interface FormInputProps extends InputProps {
  required?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? '';

    return (
      <FormControl
        {...(label !== undefined && { label })}
        {...(error !== undefined && { error })}
        {...(helperText !== undefined && { helperText })}
        {...(required !== undefined && { required })}
        htmlFor={inputId}
      >
        <Input ref={ref} id={inputId} {...(error !== undefined && { error })} {...rest} />
      </FormControl>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };

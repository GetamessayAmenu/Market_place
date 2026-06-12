import { forwardRef } from 'react';

import { Textarea, type TextareaProps } from '../Textarea';

import { FormControl } from './FormControl';

export interface FormTextareaProps extends TextareaProps {
  required?: boolean;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, required, id, ...rest }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? '';

    return (
      <FormControl
        {...(label !== undefined && { label })}
        {...(error !== undefined && { error })}
        {...(helperText !== undefined && { helperText })}
        {...(required !== undefined && { required })}
        htmlFor={textareaId}
      >
        <Textarea ref={ref} id={textareaId} {...(error !== undefined && { error })} {...rest} />
      </FormControl>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea };

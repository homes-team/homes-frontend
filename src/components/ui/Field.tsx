import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from 'react';

export function Field({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="text-[13px] font-medium text-gray-900" {...props} />;
}

const inputClasses =
  'w-full px-4 py-[13px] border border-gray-200 rounded-button text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-500 focus:border-primary';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className = '', invalid, ...rest }, ref) => (
    <input ref={ref} className={`${inputClasses} ${invalid ? 'border-danger bg-red-50' : ''} ${className}`} {...rest} />
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...rest }, ref) => <select ref={ref} className={`${inputClasses} ${className}`} {...rest} />,
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => <textarea ref={ref} className={`${inputClasses} ${className}`} {...rest} />,
);
Textarea.displayName = 'Textarea';

export function HelperText({ children }: { children: ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="-mt-2 text-[13px] font-medium text-danger" role="alert">
      {children}
    </p>
  );
}

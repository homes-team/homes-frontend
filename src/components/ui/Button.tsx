import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

const BASE = 'rounded-button text-[15px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const VARIANTS = {
  primary: 'bg-primary text-white py-[15px] px-4 hover:bg-primary-dark',
  secondary:
    'bg-white text-gray-900 border border-gray-200 py-[15px] px-4 font-medium hover:bg-gray-50',
};

function Button({ variant = 'primary', fullWidth, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}

export default Button;

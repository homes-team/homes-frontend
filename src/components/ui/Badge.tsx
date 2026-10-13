import { ReactNode } from 'react';

const VARIANTS = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-50 text-primary',
  danger: 'bg-red-50 text-danger',
  success: 'bg-success-50 text-success-dark',
  warning: 'bg-warning-50 text-warning-dark',
};

export type BadgeVariant = keyof typeof VARIANTS;

function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}

export default Badge;

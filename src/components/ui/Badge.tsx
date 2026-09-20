import { ReactNode } from 'react';

const VARIANTS = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-50 text-primary',
  danger: 'bg-red-50 text-danger',
};

function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: keyof typeof VARIANTS }) {
  return (
    <span className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}

export default Badge;

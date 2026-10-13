import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it.each([
    ['default', 'bg-gray-100'],
    ['primary', 'bg-primary-50'],
    ['danger', 'bg-red-50'],
    ['success', 'bg-success-50'],
    ['warning', 'bg-warning-50'],
  ] as const)('renders the %s variant', (variant, className) => {
    render(<Badge variant={variant}>라벨</Badge>);
    expect(screen.getByText('라벨')).toHaveClass(className);
  });
});

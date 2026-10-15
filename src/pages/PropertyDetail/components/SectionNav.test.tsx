import { fireEvent, render, screen } from '@testing-library/react';
import SectionNav from './SectionNav';

const ITEMS = [
  { id: 'overview', label: '매물 정보' },
  { id: 'building', label: '건축물 정보' },
];

describe('SectionNav', () => {
  it('highlights the first section at the start', () => {
    render(<SectionNav items={ITEMS} />);

    expect(screen.getByRole('button', { name: '매물 정보' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: '건축물 정보' })).not.toHaveAttribute('aria-current');
  });

  it('scrolls to the chosen section and highlights it', () => {
    const scrollIntoView = vi.fn();
    render(
      <>
        <SectionNav items={ITEMS} />
        <section id="building" />
      </>,
    );
    document.getElementById('building')!.scrollIntoView = scrollIntoView;

    fireEvent.click(screen.getByRole('button', { name: '건축물 정보' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(screen.getByRole('button', { name: '건축물 정보' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: '매물 정보' })).not.toHaveAttribute('aria-current');
  });

  it('does not break when the target section is missing', () => {
    render(<SectionNav items={ITEMS} />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: '건축물 정보' }))).not.toThrow();
  });
});

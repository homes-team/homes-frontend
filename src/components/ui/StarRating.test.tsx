import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { StarRating, StarRatingInput } from './StarRating';

describe('StarRating', () => {
  it('describes the score and review count to assistive tech', () => {
    render(<StarRating score={4.5} count={12} />);

    expect(screen.getByRole('img', { name: '평점 4.5점 (12건)' })).toBeInTheDocument();
  });

  it('fills only the share of stars the score covers', () => {
    const { container } = render(<StarRating score={4} />);

    expect(container.querySelector('.text-warning')).toHaveStyle({ width: '80%' });
  });

  it('keeps a score outside 0~5 inside the stars', () => {
    const { container } = render(<StarRating score={7} />);

    expect(container.querySelector('.text-warning')).toHaveStyle({ width: '100%' });
    expect(screen.getByRole('img', { name: '평점 5.0점' })).toBeInTheDocument();
  });
});

describe('StarRatingInput', () => {
  function Harness({ onPick }: { onPick: (score: number) => void }) {
    const [value, setValue] = useState<number | null>(null);
    return <StarRatingInput value={value} onChange={(score) => { setValue(score); onPick(score); }} />;
  }

  it('starts with nothing chosen and asks the user to pick', () => {
    render(<Harness onPick={vi.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(5);
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
    expect(screen.getByText('별을 눌러 평점을 골라주세요')).toBeInTheDocument();
  });

  it('reports the chosen star and shows it as selected', () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);

    fireEvent.click(screen.getByRole('radio', { name: '4점' }));

    expect(onPick).toHaveBeenCalledWith(4);
    expect(screen.getByRole('radio', { name: '4점' })).toBeChecked();
    expect(screen.getByText('4점')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import AiBanner from './AiBanner';

describe('AiBanner', () => {
  it('does not show an inactive AI prediction CTA', () => {
    render(<AiBanner />);

    expect(screen.queryByRole('button', { name: 'AI 예측 모델 체험하기' })).not.toBeInTheDocument();
    expect(screen.getByText('데이터가 알려주는 미래 가격')).toBeInTheDocument();
  });
});

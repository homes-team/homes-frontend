import { render, screen } from '@testing-library/react';
import { AiEvaluationCategory } from '../../../types/property';
import AiRadarChart from './AiRadarChart';

const keys: AiEvaluationCategory['key'][] = ['SCHOOL', 'TRANSPORT', 'NATURE', 'SUNLIGHT', 'BUILDING_CONDITION', 'INFRASTRUCTURE'];
const category = (key: AiEvaluationCategory['key'], displayScore: number | null): AiEvaluationCategory => ({
  key, label: key, displayScore, rawScore: null, status: displayScore === null ? 'PENDING_DATA' : 'AVAILABLE', source: 'NONE', description: '',
});

it('distinguishes zero, null and missing scores visually and in its accessible name', () => {
  render(<AiRadarChart categories={[category('SCHOOL', 0), category('TRANSPORT', null), category('NATURE', 5)]} />);
  const chart = screen.getByRole('img');
  expect(chart).toHaveAccessibleName('다면평가 육각형 차트. 학군지: 0 / 5점, 교통: 평가 불가, 자연: 5 / 5점, 일조량: 평가 불가, 건물 상태: 평가 불가, 인프라: 평가 불가');
  expect(screen.getAllByText('평가 불가')).toHaveLength(4);
  expect(chart.querySelectorAll('line[stroke-dasharray]')).toHaveLength(4);
  expect(chart.querySelectorAll('circle')).toHaveLength(2);
  expect(chart.querySelector('circle[cx="110"][cy="110"]')).toBeInTheDocument();
  expect(chart.querySelector('polygon[stroke="#2563eb"]')).not.toBeInTheDocument();
});

it('retains the filled polygon when all six scores are available', () => {
  render(<AiRadarChart categories={keys.map((key) => category(key, 5))} />);
  const chart = screen.getByRole('img');
  expect(chart.querySelector('polygon[stroke="#2563eb"]')).toBeInTheDocument();
  expect(screen.queryByText('평가 불가')).not.toBeInTheDocument();
  expect(chart.getAttribute('aria-label')?.match(/5 \/ 5점/g)).toHaveLength(6);
});

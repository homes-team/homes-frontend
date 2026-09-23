import { render, screen } from '@testing-library/react';
import { AiEvaluation } from '../../../types/property';
import AiEvaluationCard from './AiEvaluationCard';

const evaluation: AiEvaluation = {
  propertyId: 21,
  overall: {
    rawScore: 53.2,
    displayScore: 2.7,
    evaluatedCategoryCount: 5,
    totalCategoryCount: 6,
    completeness: 83.3,
  },
  categories: [
    {
      key: 'SCHOOL',
      label: '학군지',
      rawScore: 70,
      displayScore: 3.5,
      status: 'AVAILABLE',
      source: 'EXTERNAL_DATA',
      description: '학교 접근성 점수입니다.',
    },
    {
      key: 'SUNLIGHT',
      label: '일조량',
      rawScore: null,
      displayScore: null,
      status: 'PENDING_DATA',
      source: 'NONE',
      description: '주실 방향 정보가 필요합니다.',
    },
  ],
  report: {
    summary: '수집된 데이터를 기준으로 평가했습니다.',
    strengths: ['학군지 접근성이 좋습니다.'],
    weaknesses: ['교통 점수가 낮습니다.'],
    notice: '일부 항목은 수집 중입니다.',
  },
  scoreVersion: 'DOBONG_GEOSPATIAL_V1',
  reportModelVersion: 'RULE_BASED_REPORT_V1',
  generatedAt: '2026-09-22T11:06:49',
};

describe('AiEvaluationCard', () => {
  it('shows five-point scores and distinguishes a pending category', () => {
    render(<AiEvaluationCard evaluation={evaluation} loading={false} error={null} onRetry={() => {}} />);

    expect(screen.getByText('2.7')).toBeInTheDocument();
    expect(screen.getByText('3.5 / 5.0')).toBeInTheDocument();
    expect(screen.getByLabelText('데이터 완성도 83.3%')).toBeInTheDocument();
    expect(screen.getByText('수집 대기')).toBeInTheDocument();
    expect(screen.getByText('주실 방향 정보가 필요합니다.')).toBeInTheDocument();
  });

  it('renders when categories are absent from a malformed response', () => {
    const incompleteEvaluation = { ...evaluation, categories: null } as unknown as AiEvaluation;

    render(<AiEvaluationCard evaluation={incompleteEvaluation} loading={false} error={null} onRetry={() => {}} />);

    expect(screen.getByText('수집된 데이터를 기준으로 평가했습니다.')).toBeTruthy();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { AiEvaluation } from '../../../types/property';
import AiEvaluationSummaryCard from './AiEvaluationSummaryCard';

const evaluation: AiEvaluation = {
  propertyId: 22,
  overall: { rawScore: 84, displayScore: 4.2, evaluatedCategoryCount: 6, totalCategoryCount: 6, completeness: 100 },
  categories: [
    { key: 'SCHOOL', label: '학군지', rawScore: 80, displayScore: 4, status: 'AVAILABLE', source: 'EXTERNAL_DATA', description: '학교가 가까워요.' },
    { key: 'TRANSPORT', label: '교통', rawScore: 90, displayScore: 4.5, status: 'AVAILABLE', source: 'GEOSPATIAL_PIPELINE', description: '교통이 편리해요.' },
    { key: 'NATURE', label: '자연', rawScore: 70, displayScore: 3.5, status: 'AVAILABLE', source: 'EXTERNAL_DATA', description: '공원이 있어요.' },
    { key: 'SUNLIGHT', label: '일조량', rawScore: 80, displayScore: 4, status: 'AVAILABLE', source: 'PROPERTY_RULE', description: '채광이 좋아요.' },
    { key: 'BUILDING_CONDITION', label: '건물 상태', rawScore: 85, displayScore: 4.3, status: 'AVAILABLE', source: 'PROPERTY_RULE', description: '관리 상태가 좋아요.' },
    { key: 'INFRASTRUCTURE', label: '인프라', rawScore: 95, displayScore: 4.8, status: 'AVAILABLE', source: 'GEOSPATIAL_PIPELINE', description: '생활시설이 많아요.' },
  ],
  report: { summary: '균형이 좋은 매물입니다.', strengths: [], weaknesses: [], notice: null },
  scoreVersion: 'V3',
  reportModelVersion: 'RULE_BASED_REPORT_V1',
  generatedAt: '2026-09-24T00:00:00',
};

describe('AiEvaluationSummaryCard', () => {
  it('shows a compact radar summary and opens the detailed report', () => {
    const onDetails = vi.fn();
    render(
      <AiEvaluationSummaryCard
        evaluation={evaluation}
        loading={false}
        error={null}
        onRetry={() => {}}
        onDetails={onDetails}
      />,
    );

    expect(screen.getByLabelText('다면평가 육각형 차트')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '자세히 보기' }));
    expect(onDetails).toHaveBeenCalledOnce();
  });
});

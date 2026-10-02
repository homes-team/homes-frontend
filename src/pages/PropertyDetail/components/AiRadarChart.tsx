import { AiEvaluationCategory } from '../../../types/property';

const ORDER: AiEvaluationCategory['key'][] = [
  'SCHOOL',
  'TRANSPORT',
  'NATURE',
  'SUNLIGHT',
  'BUILDING_CONDITION',
  'INFRASTRUCTURE',
];

const LABELS: Record<AiEvaluationCategory['key'], string> = {
  SCHOOL: '학군지',
  TRANSPORT: '교통',
  NATURE: '자연',
  SUNLIGHT: '일조량',
  BUILDING_CONDITION: '건물 상태',
  INFRASTRUCTURE: '인프라',
};

function point(index: number, ratio: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / ORDER.length;
  const radius = 70 * ratio;
  return [110 + Math.cos(angle) * radius, 110 + Math.sin(angle) * radius];
}

function polygonPoints(ratio: number) {
  return ORDER.map((_, index) => point(index, ratio).join(',')).join(' ');
}

function AiRadarChart({ categories }: { categories: AiEvaluationCategory[] }) {
  const byKey = new Map(categories.map((category) => [category.key, category]));
  const scores = ORDER.map((key) => byKey.get(key)?.displayScore ?? null);
  const scorePoints = scores.map((score, index) => (
    score === null ? null : point(index, Math.max(0, Math.min(1, score / 5)))
  ));
  const complete = scores.every((score) => score !== null);
  const description = ORDER.map((key, index) => (
    `${LABELS[key]}: ${scores[index] === null ? '평가 불가' : `${scores[index]} / 5점`}`
  )).join(', ');

  return (
    <svg
      viewBox="0 0 220 220"
      className="mx-auto h-auto w-full max-w-[240px]"
      role="img"
      aria-label={`다면평가 육각형 차트. ${description}`}
    >
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon key={ratio} points={polygonPoints(ratio)} fill="none" stroke="#dbeafe" strokeWidth="1" />
      ))}
      {ORDER.map((key, index) => {
        const [x, y] = point(index, 1);
        return <line key={key} x1="110" y1="110" x2={x} y2={y} stroke={scores[index] === null ? '#9ca3af' : '#e5e7eb'} strokeDasharray={scores[index] === null ? '3 3' : undefined} strokeWidth="1" />;
      })}
      {complete ? (
        <polygon points={scorePoints.map((p) => p!.join(',')).join(' ')} fill="rgba(37, 99, 235, 0.24)" stroke="#2563eb" strokeWidth="2.5" />
      ) : scorePoints.map((p, index) => {
        if (!p) return null;
        const next = scorePoints[(index + 1) % ORDER.length];
        return (
          <g key={ORDER[index]}>
            {next && <line x1={p[0]} y1={p[1]} x2={next[0]} y2={next[1]} stroke="#2563eb" strokeWidth="2.5" />}
            <circle cx={p[0]} cy={p[1]} r="3" fill="#2563eb" />
          </g>
        );
      })}
      {ORDER.map((key, index) => {
        const [x, y] = point(index, 1.24);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-600 text-[9px] font-medium"
          >
            {LABELS[key]}
            {scores[index] === null && <tspan x={x} dy="11" className="text-[8px]">평가 불가</tspan>}
          </text>
        );
      })}
    </svg>
  );
}

export default AiRadarChart;

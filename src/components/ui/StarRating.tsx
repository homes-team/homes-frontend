import { useState } from 'react';

const STARS = '★★★★★';
const MAX_SCORE = 5;

interface StarRatingProps {
  /** 0~5. 소수는 별 일부만 채워 보여준다 */
  score: number;
  /** 평가 건수. 주면 "(12)"로 덧붙인다 */
  count?: number;
}

/** 읽기 전용 별점 — 별 5개 + 숫자 */
export function StarRating({ score, count }: StarRatingProps) {
  const filled = Math.min(MAX_SCORE, Math.max(0, score));
  const label = `평점 ${filled.toFixed(1)}점${count !== undefined ? ` (${count}건)` : ''}`;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs" role="img" aria-label={label}>
      <span className="relative inline-block whitespace-nowrap leading-none text-gray-200" aria-hidden="true">
        {STARS}
        <span
          className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-warning"
          style={{ width: `${(filled / MAX_SCORE) * 100}%` }}
        >
          {STARS}
        </span>
      </span>
      <span aria-hidden="true" className="font-bold text-gray-900">
        {filled.toFixed(1)}
      </span>
      {count !== undefined && (
        <span aria-hidden="true" className="text-gray-500">
          ({count})
        </span>
      )}
    </span>
  );
}

interface StarRatingInputProps {
  /** 선택한 점수. 아직 고르지 않았으면 null */
  value: number | null;
  onChange: (score: number) => void;
  name?: string;
}

/** 별 1~5개를 눌러 고르는 평점 입력. 라디오 버튼이라 키보드(방향키)로도 고를 수 있다 */
export function StarRatingInput({ value, onChange, name = 'score' }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value ?? 0;

  return (
    <fieldset className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      <legend className="sr-only">평점</legend>
      {Array.from({ length: MAX_SCORE }, (_, index) => index + 1).map((point) => (
        <label
          key={point}
          onMouseEnter={() => setHovered(point)}
          className={`cursor-pointer rounded text-3xl leading-none transition-colors focus-within:ring-2 focus-within:ring-primary ${
            point <= shown ? 'text-warning' : 'text-gray-200'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={point}
            checked={value === point}
            onChange={() => onChange(point)}
            aria-label={`${point}점`}
            className="sr-only"
          />
          <span aria-hidden="true">★</span>
        </label>
      ))}
      <span className="ml-2 text-sm text-gray-500">{value === null ? '별을 눌러 평점을 골라주세요' : `${value}점`}</span>
    </fieldset>
  );
}

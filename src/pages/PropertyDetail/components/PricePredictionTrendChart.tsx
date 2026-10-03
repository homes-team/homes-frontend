import { ComparableTrade } from '../../../types/property';
import { formatKoreanWon } from '../../../utils/format';

interface Props {
  trades: ComparableTrade[];
  predictedPrice: number;
}

const WIDTH = 420;
const HEIGHT = 210;
const LEFT = 48;
const RIGHT = 22;
const TOP = 24;
const BOTTOM = 38;

function compactPrice(manwon: number) {
  if (manwon >= 10000) {
    const value = Math.round((manwon / 10000) * 10) / 10;
    return `${value}억`;
  }
  return `${Math.round(manwon / 1000) / 10}천만`;
}

function shortDate(value: string) {
  const [, month, day] = value.split('-');
  return `${month}.${day}`;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middleX = (previous.x + point.x) / 2;
    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function PricePredictionTrendChart({ trades, predictedPrice }: Props) {
  const history = [...trades]
    .filter((trade) => trade.priceTenThousandWon > 0)
    .sort((left, right) => left.contractDate.localeCompare(right.contractDate));
  if (history.length < 2) return null;

  const values = [...history.map((trade) => trade.priceTenThousandWon), predictedPrice];
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.18, rawMax * 0.04, 500);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const chartWidth = WIDTH - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;
  const y = (value: number) => TOP + ((max - value) / (max - min)) * chartHeight;
  const xStep = chartWidth / history.length;
  const historyPoints = history.map((trade, index) => ({
    x: LEFT + xStep * index,
    y: y(trade.priceTenThousandWon),
    trade,
  }));
  const predictedPoint = { x: LEFT + chartWidth, y: y(predictedPrice) };
  const last = historyPoints[historyPoints.length - 1];
  const forecastPath = smoothPath([last, predictedPoint]);
  const gridValues = [max - padding * 0.4, (min + max) / 2, min + padding * 0.4];
  const accessibleSummary = `대표 실거래 가격 추이 ${history.length}건, 미래 예상가 ${formatKoreanWon(predictedPrice)}`;

  return (
    <figure className="mt-5 rounded-button border border-gray-100 bg-gray-50/70 p-3">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-gray-700">대표 실거래 가격 추이</span>
        <span className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><i className="h-0.5 w-3 bg-gray-400" />실거래</span>
          <span className="flex items-center gap-1"><i className="h-0.5 w-3 border-t-2 border-dashed border-primary" />예상</span>
        </span>
      </figcaption>
      <svg
        role="img"
        aria-label={accessibleSummary}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full overflow-visible"
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(value)} y2={y(value)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={LEFT - 8} y={y(value) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {compactPrice(value)}
            </text>
          </g>
        ))}

        <path
          d={smoothPath(historyPoints)}
          fill="none"
          stroke="#6b7280"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="price-chart-history-line"
        />
        <path
          d={forecastPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 7"
          className="price-chart-forecast-line"
        />

        {historyPoints.map(({ x, y: pointY, trade }, index) => (
          <g key={`${trade.contractDate}-${trade.floor}-${index}`} className="price-chart-history-point">
            <circle cx={x} cy={pointY} r="4" fill="white" stroke="#6b7280" strokeWidth="2">
              <title>{`${trade.contractDate} ${formatKoreanWon(trade.priceTenThousandWon)}`}</title>
            </circle>
          </g>
        ))}

        <g className="price-chart-prediction-point">
          <circle cx={predictedPoint.x} cy={predictedPoint.y} r="11" fill="#dbeafe" className="price-chart-pulse" />
          <circle cx={predictedPoint.x} cy={predictedPoint.y} r="5" fill="#2563eb">
            <title>{`예상가 ${formatKoreanWon(predictedPrice)}`}</title>
          </circle>
          <text x={predictedPoint.x} y={predictedPoint.y - 15} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563eb">
            {compactPrice(predictedPrice)}
          </text>
        </g>

        <text x={historyPoints[0].x} y={HEIGHT - 12} textAnchor="middle" fontSize="10" fill="#9ca3af">
          {shortDate(history[0].contractDate)}
        </text>
        <text x={last.x} y={HEIGHT - 12} textAnchor="middle" fontSize="10" fill="#9ca3af">
          {shortDate(history[history.length - 1].contractDate)}
        </text>
        <text x={predictedPoint.x} y={HEIGHT - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563eb">
          미래 예상
        </text>
      </svg>
      <p className="px-1 text-[11px] leading-relaxed text-gray-400">
        점은 대표 실거래이며, 점선 구간은 실거래가 아닌 모델 예상치예요.
      </p>
    </figure>
  );
}

export default PricePredictionTrendChart;

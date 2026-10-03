import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import { PropertyPricePrediction } from '../../../types/property';
import { formatKoreanWon } from '../../../utils/format';

interface Props {
  prediction: PropertyPricePrediction | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const CONFIDENCE_LABEL = {
  HIGH: '신뢰도 높음',
  MEDIUM: '신뢰도 보통',
  LOW: '신뢰도 낮음',
  UNAVAILABLE: '신뢰도 산정 불가',
} as const;

const SCOPE_LABEL = {
  SAME_COMPLEX: '동일 단지',
  SAME_LEGAL_DONG: '동일 법정동',
  SAME_DISTRICT: '동일 시·군·구',
  UNAVAILABLE: '비교 자료 없음',
} as const;

const STATUS_MESSAGE = {
  INSUFFICIENT_DATA: '가격을 예측하기 위한 유사 거래가 부족합니다.',
  UNSUPPORTED: '현재는 아파트 매매 매물만 가격 예측을 지원합니다.',
  ADDRESS_UNAVAILABLE: '매물 주소를 기준으로 실거래 지역을 확인할 수 없습니다.',
  PROVIDER_UNAVAILABLE: '실거래가 정보를 일시적으로 불러올 수 없습니다.',
} as const;

function formatMonth(value: string | null) {
  return value ? value.replace('-', '.') : '-';
}

function formatDate(value: string) {
  return value.replace(/-/g, '.');
}

function PricePredictionCard({ prediction, loading, error, onRetry }: Props) {
  const available = prediction?.status === 'AVAILABLE'
    && prediction.predictedPrice !== null
    && prediction.minimumPrice !== null
    && prediction.maximumPrice !== null;

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-900">매물 가격 예측</p>
          {available && (
            <Badge variant={prediction.confidence === 'LOW' ? 'default' : 'primary'}>
              {CONFIDENCE_LABEL[prediction.confidence]}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">국토교통부 실거래가와 유사 매물을 비교했어요.</p>
      </div>

      {loading && (
        <div aria-live="polite" className="animate-pulse px-5 py-8">
          <div className="mx-auto h-8 w-40 rounded bg-gray-100" />
          <div className="mx-auto mt-3 h-4 w-56 rounded bg-gray-100" />
        </div>
      )}

      {!loading && error && (
        <div aria-live="polite" className="px-5 py-8 text-center text-sm text-danger">
          <p>{error}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>다시 시도</button>
        </div>
      )}

      {!loading && !error && prediction && !available && (
        <div aria-live="polite" className="px-5 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">
            {prediction.status === 'AVAILABLE'
              ? '가격 예측 결과를 표시할 수 없습니다.'
              : STATUS_MESSAGE[prediction.status]}
          </p>
          {prediction.status === 'PROVIDER_UNAVAILABLE' && (
            <button type="button" className="mt-2 text-sm font-semibold text-primary underline" onClick={onRetry}>
              다시 시도
            </button>
          )}
        </div>
      )}

      {!loading && !error && prediction && available && (
        <div className="px-5 py-5">
          <div className="text-center">
            <p className="text-xs font-medium text-primary">다음 거래 예상가</p>
            <p className="mt-1 text-[28px] font-bold tracking-tight text-gray-900">
              {formatKoreanWon(prediction.predictedPrice!)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              예상 범위 {formatKoreanWon(prediction.minimumPrice!)} ~ {formatKoreanWon(prediction.maximumPrice!)}
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-button bg-gray-50 p-4 text-sm">
            <div>
              <dt className="text-xs text-gray-500">비교 범위</dt>
              <dd className="mt-1 font-semibold text-gray-900">{SCOPE_LABEL[prediction.comparisonScope]}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">비교 거래</dt>
              <dd className="mt-1 font-semibold text-gray-900">{prediction.sampleCount}건</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-gray-500">참조 기간</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {formatMonth(prediction.referenceFrom)} ~ {formatMonth(prediction.referenceTo)}
              </dd>
            </div>
          </dl>

          {prediction.comparisonScope === 'SAME_DISTRICT' && (
            <p className="mt-3 text-xs leading-relaxed text-amber-700">
              동일 단지 거래가 부족해 같은 시·군·구의 유사 매물을 기준으로 계산했어요.
            </p>
          )}

          {prediction.representativeTrades.length > 0 && (
            <details className="mt-5 border-t border-gray-100 pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700">대표 실거래 보기</summary>
              <ul className="mt-3 divide-y divide-gray-100">
                {prediction.representativeTrades.slice(0, 5).map((trade, index) => (
                  <li key={`${trade.contractDate}-${trade.floor}-${index}`} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {trade.apartmentName ?? trade.legalDongName ?? '유사 아파트'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(trade.contractDate)} · {trade.floor}층 · 전용 {trade.areaSquareMeters}㎡
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-gray-900">
                      {formatKoreanWon(trade.priceTenThousandWon)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <p className="mt-5 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-400">
            국토교통부 실거래 자료를 기반으로 계산한 참고용 추정치이며, 실제 거래 가격을 보장하지 않습니다.
          </p>
        </div>
      )}
    </Card>
  );
}

export default PricePredictionCard;

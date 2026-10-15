import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { formatManwon } from '../../../utils/format';
import { formatCostManwon, formatRate } from '../../../utils/calcFormat';
import { FeeCapSubject, checkProposedRate, commissionCalculatorPath, legalFeeCap } from '../../../utils/legalFeeCap';

interface LegalFeeCapCardProps {
  property: FeeCapSubject;
  /** 중개사가 입찰 폼에 입력 중인 요율(%). 입력한 값이 상한 안인지 바로 보여준다 */
  proposedRate?: number;
}

/** 중개사가 입찰 전에 보는 이 매물의 중개보수 법정 상한 (집주인 화면에는 쓰지 않는다) */
function LegalFeeCapCard({ property, proposedRate }: LegalFeeCapCardProps) {
  const cap = legalFeeCap(property);
  if (!cap) return null;

  const check = proposedRate && proposedRate > 0 ? checkProposedRate(cap, proposedRate) : null;
  const toManwon = (won: number) => formatCostManwon(won / 10000);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-gray-900">⚖️ 법정 중개보수 상한</h2>
        <Link to={commissionCalculatorPath(property)} className="text-[13px] font-bold text-primary underline">
          계산기로 자세히 보기
        </Link>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-gray-500">상한 요율</dt>
        <dd className="font-bold text-gray-900">
          {formatRate(cap.rate)}%{cap.limit !== null && <span className="font-normal text-gray-500"> (한도 {formatManwon(cap.limit)})</span>}
        </dd>
        <dt className="text-gray-500">이 매물 최대 중개보수</dt>
        <dd className="font-bold text-gray-900">
          약 {toManwon(cap.maxFee)}
          <span className="font-normal text-gray-500"> (부가세 별도)</span>
        </dd>
        {cap.limited && (
          <>
            <dt className="text-gray-500">입찰 가능한 최대 요율</dt>
            <dd className="font-bold text-gray-900">
              {formatRate(cap.effectiveRate)}%
              <span className="font-normal text-gray-500"> (한도액 때문에 요율표보다 낮아요)</span>
            </dd>
          </>
        )}
      </dl>

      {check && (
        <p
          role="status"
          className={`rounded-button px-3 py-2 text-[13px] font-medium ${
            check.exceeds ? 'bg-red-50 text-danger' : 'bg-success-50 text-success-dark'
          }`}
        >
          입력한 {formatRate(proposedRate as number)}%는 약 {toManwon(check.amount)} ·{' '}
          {check.exceeds ? `법정 상한(${toManwon(cap.maxFee)})을 넘어요` : '법정 상한 안이에요'}
        </p>
      )}

      <p className="text-xs leading-relaxed text-gray-500">
        서울 요율표 기준이고, 월세는 보증금 + 월세 × 100으로 환산한 금액에 요율을 적용해요. 지역 조례에 따라 다를 수 있고, 실제 금액은 상한 안에서 집주인과 협의해요.
        {cap.presale && ' 분양권은 프리미엄을 알 수 없어 불입금액만으로 계산했어요.'}
      </p>
    </Card>
  );
}

export default LegalFeeCapCard;

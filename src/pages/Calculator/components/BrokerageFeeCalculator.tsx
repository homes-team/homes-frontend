import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { HelperText } from '../../../components/ui/Field';
import { formatCostManwon, formatRate, formatWon, parseCalcNumber } from '../../../utils/calcFormat';
import {
  BrokerageDealType,
  BrokerageTarget,
  calculateBrokerageFee,
  DEFAULT_VAT_RATE,
  HOUSE_LEASE_TIERS,
  HOUSE_SALE_TIERS,
  OFFICETEL_LEASE_RATE,
  OFFICETEL_SALE_RATE,
  OTHER_MAX_RATE,
  RateTier,
} from '../../../utils/brokerageFee';
import { CALC_DISCLAIMER, CheckField, NumberField, ResultLine, ToggleGroup, Verdict } from './CalcFields';

const DEALS: ReadonlyArray<{ value: BrokerageDealType; label: string }> = [
  { value: 'SALE', label: '매매' },
  { value: 'JEONSE', label: '전세' },
  { value: 'MONTHLY', label: '월세' },
];

const TARGETS: ReadonlyArray<{ value: BrokerageTarget; label: string }> = [
  { value: 'HOUSE', label: '주택' },
  { value: 'OFFICETEL', label: '오피스텔' },
  { value: 'PRESALE', label: '분양권' },
  { value: 'OTHER', label: '그 외' },
];

const PRICE_LABEL: Record<BrokerageDealType, string> = { SALE: '매매가', JEONSE: '전세금', MONTHLY: '보증금' };

const DEAL_FROM_QUERY: Record<string, BrokerageDealType> = { sale: 'SALE', jeonse: 'JEONSE', monthly: 'MONTHLY' };

/** 요율표 한 줄: "5천만원 미만", "5천만원 이상 ~ 2억원 미만" */
function rangeLabel(tiers: RateTier[], index: number): string {
  const from = tiers[index].from;
  const to = tiers[index + 1]?.from;
  if (index === 0) return `${formatCostManwon(to)} 미만`;
  return to === undefined ? `${formatCostManwon(from)} 이상` : `${formatCostManwon(from)} 이상 ~ ${formatCostManwon(to)} 미만`;
}

function RateTable({ title, tiers }: { title: string; tiers: RateTier[] }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-bold text-gray-900">{title}</p>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-1.5 text-left font-medium">거래금액</th>
            <th className="py-1.5 text-right font-medium">상한요율</th>
            <th className="py-1.5 text-right font-medium">한도액</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-700">
          {tiers.map((tier, index) => (
            <tr key={tier.from}>
              <td className="py-1.5">{rangeLabel(tiers, index)}</td>
              <td className="py-1.5 text-right">{formatRate(tier.rate)}%</td>
              <td className="py-1.5 text-right">{tier.limit === null ? '없음' : formatCostManwon(tier.limit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 공인중개사 중개보수(중개수수료) 법정 상한 계산기 — 서울특별시 기준 */
function BrokerageFeeCalculator() {
  const [searchParams] = useSearchParams();

  const [deal, setDeal] = useState<BrokerageDealType>(DEAL_FROM_QUERY[searchParams.get('trade') ?? ''] ?? 'SALE');
  const [target, setTarget] = useState<BrokerageTarget>('HOUSE');
  const [price, setPrice] = useState(searchParams.get('price') ?? '30000');
  const [monthlyRent, setMonthlyRent] = useState(searchParams.get('rent') ?? '');
  const [premium, setPremium] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRate, setCustomRate] = useState('');
  const [useCustomVat, setUseCustomVat] = useState(false);
  const [vatRate, setVatRate] = useState(String(DEFAULT_VAT_RATE));

  const presale = target === 'PRESALE';
  // 분양권은 매매만 있다
  const effectiveDeal: BrokerageDealType = presale ? 'SALE' : deal;

  const result = useMemo(
    () =>
      calculateBrokerageFee({
        deal: effectiveDeal,
        target,
        price: parseCalcNumber(price, 0, 10_000_000),
        monthlyRent: parseCalcNumber(monthlyRent, 0, 1_000_000),
        premium: parseCalcNumber(premium, 0, 10_000_000),
        customRate: useCustomRate && customRate.trim() !== '' ? parseCalcNumber(customRate, 0, 100) : null,
        vatRate: useCustomVat ? parseCalcNumber(vatRate, 0, 100) : DEFAULT_VAT_RATE,
      }),
    [effectiveDeal, target, price, monthlyRent, premium, useCustomRate, customRate, useCustomVat, vatRate],
  );

  const priceLabel = presale ? '거래 당시까지 불입한 금액 (융자 포함)' : PRICE_LABEL[effectiveDeal];
  const vat = useCustomVat ? parseCalcNumber(vatRate, 0, 100) : DEFAULT_VAT_RATE;

  const rateHint =
    target === 'OTHER'
      ? `주택 외는 ${OTHER_MAX_RATE}% 이내에서 협의해요`
      : target === 'OFFICETEL'
        ? `오피스텔은 매매 ${OFFICETEL_SALE_RATE}%, 임대차 ${OFFICETEL_LEASE_RATE}%예요`
        : undefined;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-gray-900">계약 종류</h2>
            <ToggleGroup
              label="계약 종류"
              value={effectiveDeal}
              options={DEALS.map((option) => ({ ...option, disabled: presale && option.value !== 'SALE' }))}
              onChange={setDeal}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-gray-900">물건 종류</h2>
            <ToggleGroup label="물건 종류" value={target} options={TARGETS} onChange={setTarget} />
            {target === 'OFFICETEL' && <HelperText>전용 85㎡ 이하이고 부엌·화장실 등 일정 설비를 갖춘 경우의 요율이에요.</HelperText>}
            {presale && <HelperText>분양권 거래금액은 (불입한 금액 + 프리미엄)으로 계산해요.</HelperText>}
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          <NumberField id="brokeragePrice" label={priceLabel} unit="만원" value={price} onChange={setPrice} />
          {effectiveDeal === 'MONTHLY' && !presale && (
            <NumberField id="brokerageRent" label="월세" unit="만원" step="0.1" value={monthlyRent} onChange={setMonthlyRent} />
          )}
          {presale && <NumberField id="brokeragePremium" label="프리미엄" unit="만원" value={premium} onChange={setPremium} />}

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
            <CheckField id="customRateCheck" label="요율 직접 입력" checked={useCustomRate} onChange={setUseCustomRate} />
            {useCustomRate && (
              <NumberField
                id="customRate"
                label="지정 요율"
                unit="%"
                step="0.01"
                value={customRate}
                onChange={setCustomRate}
                hint="직접 입력하면 법정 한도액은 적용하지 않고 입력한 요율 그대로 계산해요"
              />
            )}
            <CheckField id="customVatCheck" label="부가세율 직접 입력" checked={useCustomVat} onChange={setUseCustomVat} />
            {useCustomVat && (
              <NumberField id="customVatRate" label="부가세율" unit="%" step="0.1" value={vatRate} onChange={setVatRate} hint="간이과세자 등은 부가세율이 달라요. 면세는 0을 입력하세요" />
            )}
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="flex flex-col gap-5">
          <Verdict tone="primary">
            <p className="text-[13px] text-gray-600">중개보수 (부가세 포함)</p>
            <p className="text-2xl font-bold text-primary">{formatWon(result.total)}</p>
          </Verdict>

          <dl className="divide-y divide-gray-100">
            <ResultLine
              label={presale ? '거래금액 (불입금 + 프리미엄)' : effectiveDeal === 'MONTHLY' ? '환산 거래금액' : '거래금액'}
              value={formatCostManwon(result.tradeAmount)}
            />
            <ResultLine
              label={result.customRateUsed ? '지정 요율' : '상한요율'}
              value={`${formatRate(result.rate)}%`}
            />
            {!result.customRateUsed && (
              <ResultLine label="한도액" value={result.limit === null ? '없음' : formatCostManwon(result.limit)} />
            )}
            <ResultLine label="중개보수" value={formatWon(result.fee)} strong />
            <ResultLine label={`부가세 (${formatRate(vat)}%)`} value={formatWon(result.vat)} />
            <ResultLine label="합계" value={formatWon(result.total)} strong />
          </dl>

          {result.limited && (
            <p className="rounded-lg bg-warning-50 p-3 text-[13px] text-warning-dark">
              요율로 계산한 {formatWon(result.rawFee)}이 한도액({formatCostManwon(result.limit ?? 0)})을 넘어서 한도액으로 계산했어요.
            </p>
          )}
          {effectiveDeal === 'MONTHLY' && !presale && (
            <p className="text-xs leading-relaxed text-gray-500">
              월세는 <strong>보증금 + 월세 × 100</strong>으로 환산해요. 환산 금액이 5천만원 미만이면 보증금 + 월세 × 70을 써요.
            </p>
          )}
          {rateHint && !result.customRateUsed && <p className="text-xs text-gray-500">{rateHint}</p>}

          <p className="text-xs leading-relaxed text-gray-500">
            서울특별시 기준 <strong>상한</strong> 요율이에요. 상한 범위 안에서 중개사와 협의할 수 있어요. 다른 지역은 조례에 따라 요율이 달라서
            &lsquo;요율 직접 입력&rsquo;으로 계산해주세요. {CALC_DISCLAIMER}
          </p>

          <details className="rounded-lg bg-gray-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-gray-900">서울 기준 중개보수 요율표 보기</summary>
            <div className="mt-4 flex flex-col gap-5">
              <RateTable title="주택 · 매매 / 교환" tiers={HOUSE_SALE_TIERS} />
              <RateTable title="주택 · 임대차 등 (매매·교환 이외)" tiers={HOUSE_LEASE_TIERS} />
              <p className="text-[13px] text-gray-700">
                오피스텔: 매매 {OFFICETEL_SALE_RATE}% / 임대차 {OFFICETEL_LEASE_RATE}% · 주택 외: {OTHER_MAX_RATE}% 이내 협의
              </p>
            </div>
          </details>
        </Card>
      </div>
    </div>
  );
}

export default BrokerageFeeCalculator;

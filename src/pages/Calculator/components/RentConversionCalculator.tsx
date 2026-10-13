import { useState } from 'react';
import Card from '../../../components/ui/Card';
import { formatCostManwon, formatRate, parseCalcNumber } from '../../../utils/calcFormat';
import {
  conversionRate,
  HOUSING_CONVERSION_RATE_CAP,
  jeonseToMonthlyRent,
  monthlyRentToJeonse,
} from '../../../utils/rentConversion';
import { CALC_DISCLAIMER, NumberField, ResultLine, ToggleGroup, Verdict } from './CalcFields';

type ConversionMode = 'TO_MONTHLY' | 'TO_JEONSE' | 'RATE';

const MODES: ReadonlyArray<{ value: ConversionMode; label: string }> = [
  { value: 'TO_MONTHLY', label: '전세 → 월세' },
  { value: 'TO_JEONSE', label: '월세 → 전세' },
  { value: 'RATE', label: '전환율 계산' },
];

/** 전월세 전환 — 전세↔월세 금액 환산과 전월세 전환율 역산 */
function RentConversionCalculator() {
  const [mode, setMode] = useState<ConversionMode>('TO_MONTHLY');
  const [jeonseDeposit, setJeonseDeposit] = useState('30000');
  const [monthlyDeposit, setMonthlyDeposit] = useState('3000');
  const [monthlyRent, setMonthlyRent] = useState('90');
  const [rate, setRate] = useState(String(HOUSING_CONVERSION_RATE_CAP));

  const jeonse = parseCalcNumber(jeonseDeposit, 0, 100_000_000);
  const deposit = parseCalcNumber(monthlyDeposit, 0, 100_000_000);
  const rent = parseCalcNumber(monthlyRent, 0, 1_000_000);
  const ratePercent = parseCalcNumber(rate, 0, 100);

  const convertedRent = jeonseToMonthlyRent(jeonse, deposit, ratePercent);
  const convertedJeonse = monthlyRentToJeonse(deposit, rent, ratePercent);
  const impliedRate = conversionRate(jeonse, deposit, rent);

  // 화면에 보여줄 "적용된 전환율": 전환율 계산 모드는 역산한 값, 나머지는 입력한 값
  const appliedRate = mode === 'RATE' ? impliedRate : ratePercent;
  const overCap = appliedRate !== null && appliedRate > HOUSING_CONVERSION_RATE_CAP;

  const headline =
    mode === 'TO_MONTHLY'
      ? convertedRent === null
        ? '전세금이 월세 보증금보다 커야 계산할 수 있어요'
        : `월세 ${formatCostManwon(convertedRent)}`
      : mode === 'TO_JEONSE'
        ? convertedJeonse === null
          ? '전환율을 0보다 크게 입력해주세요'
          : `전세 보증금 ${formatCostManwon(convertedJeonse)}`
        : impliedRate === null
          ? '전세금이 월세 보증금보다 커야 계산할 수 있어요'
          : `전월세 전환율 연 ${formatRate(impliedRate)}%`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5">
          <h2 className="text-base font-bold text-gray-900">무엇을 계산할까요?</h2>
          <ToggleGroup label="계산 종류" value={mode} options={MODES} onChange={setMode} />
        </Card>

        <Card className="flex flex-col gap-5">
          {mode !== 'TO_JEONSE' && (
            <NumberField id="convJeonse" label="전세 보증금" unit="만원" value={jeonseDeposit} onChange={setJeonseDeposit} />
          )}
          <NumberField
            id="convMonthlyDeposit"
            label="월세 보증금"
            unit="만원"
            value={monthlyDeposit}
            onChange={setMonthlyDeposit}
            hint="월세 계약에서 내는 보증금이에요. 없으면 0"
          />
          {mode !== 'TO_MONTHLY' && (
            <NumberField id="convRent" label="월세" unit="만원" step="0.1" value={monthlyRent} onChange={setMonthlyRent} />
          )}
          {mode !== 'RATE' && (
            <NumberField
              id="convRate"
              label="전월세 전환율 (연)"
              unit="%"
              step="0.1"
              value={rate}
              onChange={setRate}
              hint={`주택 상한은 연 ${HOUSING_CONVERSION_RATE_CAP}%예요 (기준금리에 따라 바뀔 수 있어요)`}
            />
          )}
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="flex flex-col gap-5">
          <Verdict tone={overCap ? 'warning' : 'primary'}>
            <p className="text-lg font-bold">{headline}</p>
            {overCap && appliedRate !== null && (
              <p className="mt-1 text-[13px]">
                전환율 {formatRate(appliedRate)}%는 주택 상한({HOUSING_CONVERSION_RATE_CAP}%)보다 높아요
              </p>
            )}
          </Verdict>

          <dl className="divide-y divide-gray-100">
            {mode === 'TO_MONTHLY' && (
              <>
                <ResultLine label="월세로 바꿀 금액" value={formatCostManwon(Math.max(0, jeonse - deposit))} />
                <ResultLine label="적용 전환율" value={`연 ${formatRate(ratePercent)}%`} />
                <ResultLine label="월세" value={convertedRent === null ? '-' : formatCostManwon(convertedRent)} strong />
                <ResultLine label="연 월세 합계" value={convertedRent === null ? '-' : formatCostManwon(convertedRent * 12)} />
              </>
            )}
            {mode === 'TO_JEONSE' && (
              <>
                <ResultLine label="연 월세 합계" value={formatCostManwon(rent * 12)} />
                <ResultLine label="적용 전환율" value={`연 ${formatRate(ratePercent)}%`} />
                <ResultLine label="월세 → 전세 환산액" value={convertedJeonse === null ? '-' : formatCostManwon(convertedJeonse - deposit)} />
                <ResultLine label="전세 보증금" value={convertedJeonse === null ? '-' : formatCostManwon(convertedJeonse)} strong />
              </>
            )}
            {mode === 'RATE' && (
              <>
                <ResultLine label="월세로 바꾼 금액" value={formatCostManwon(Math.max(0, jeonse - deposit))} />
                <ResultLine label="연 월세 합계" value={formatCostManwon(rent * 12)} />
                <ResultLine label="전월세 전환율" value={impliedRate === null ? '-' : `연 ${formatRate(impliedRate)}%`} strong />
              </>
            )}
          </dl>

          <div className="rounded-lg bg-gray-50 p-4 text-[13px] leading-relaxed text-gray-600">
            <p className="font-bold text-gray-900">계산식</p>
            <p>월세 = (전세 보증금 − 월세 보증금) × 전환율 ÷ 12</p>
            <p>전환율 = 월세 × 12 ÷ (전세 보증금 − 월세 보증금)</p>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            주택 전월세 전환율 상한은 &ldquo;연 10%&rdquo;와 &ldquo;기준금리 + 2%p&rdquo; 중 낮은 값이라 기준금리가 바뀌면 달라져요(주택임대차보호법
            시행령). 계약 전에 최신 상한을 확인해주세요. {CALC_DISCLAIMER}
          </p>
        </Card>
      </div>
    </div>
  );
}

export default RentConversionCalculator;

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { formatCostManwon, formatRate, parseCalcNumber } from '../../../utils/calcFormat';
import { calculateRentCompare, SideCost } from '../../../utils/rentCompare';
import { CALC_DISCLAIMER, NumberField, Verdict } from './CalcFields';

const MAX_MONEY = 100_000_000;

/** 비워두면 공통 값을 쓰는 선택 입력 → null */
const optionalRate = (raw: string): number | null => (raw.trim() === '' ? null : parseCalcNumber(raw, 0, 100));

function ResultRow({ label, jeonse, monthly, strong = false }: { label: string; jeonse: string; monthly: string; strong?: boolean }) {
  return (
    <tr className={strong ? 'font-bold text-gray-900' : 'text-gray-700'}>
      <th scope="row" className="py-2.5 pr-3 text-left text-[13px] font-medium text-gray-500">
        {label}
      </th>
      <td className="py-2.5 text-right text-[15px]">{jeonse}</td>
      <td className="py-2.5 text-right text-[15px]">{monthly}</td>
    </tr>
  );
}

const dash = (value: number) => (value === 0 ? '-' : formatCostManwon(value));

/** 전세(대출 이용)와 월세의 월 비용을 비교하는 계산기 */
function RentCompareCalculator() {
  const [searchParams] = useSearchParams();

  // 매물 상세에서 넘어오면 해당 매물의 가격으로 미리 채운다 (?jeonse=전세금 / ?deposit=보증금&rent=월세)
  const jeonseFromListing = Number(searchParams.get('jeonse'));
  const hasJeonse = Number.isFinite(jeonseFromListing) && jeonseFromListing > 0;
  const prefillLoan = hasJeonse ? Math.round(jeonseFromListing * 0.7) : 21000;
  const prefillOwn = hasJeonse ? jeonseFromListing - prefillLoan : 9000;

  const [jeonseOwn, setJeonseOwn] = useState(String(prefillOwn));
  const [jeonseLoan, setJeonseLoan] = useState(String(prefillLoan));
  const [monthlyOwn, setMonthlyOwn] = useState(searchParams.get('deposit') ?? '3000');
  const [monthlyLoan, setMonthlyLoan] = useState('0');
  const [monthlyRent, setMonthlyRent] = useState(searchParams.get('rent') ?? '90');

  const [returnRate, setReturnRate] = useState('3');
  const [loanRate, setLoanRate] = useState('4');
  const [months, setMonths] = useState('24');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jeonseReturn, setJeonseReturn] = useState('');
  const [jeonseLoanRate, setJeonseLoanRate] = useState('');
  const [jeonseOneTime, setJeonseOneTime] = useState('');
  const [jeonseExtra, setJeonseExtra] = useState('');
  const [monthlyReturn, setMonthlyReturn] = useState('');
  const [monthlyLoanRate, setMonthlyLoanRate] = useState('');
  const [monthlyOneTime, setMonthlyOneTime] = useState('');
  const [monthlyExtra, setMonthlyExtra] = useState('');

  const periodMonths = Math.round(parseCalcNumber(months, 1, 360));

  const result = useMemo(
    () =>
      calculateRentCompare({
        returnRate: parseCalcNumber(returnRate, 0, 100),
        loanRate: parseCalcNumber(loanRate, 0, 100),
        months: periodMonths,
        jeonse: {
          ownFunds: parseCalcNumber(jeonseOwn, 0, MAX_MONEY),
          loan: parseCalcNumber(jeonseLoan, 0, MAX_MONEY),
          returnRate: optionalRate(jeonseReturn),
          loanRate: optionalRate(jeonseLoanRate),
          oneTimeCost: parseCalcNumber(jeonseOneTime, 0, MAX_MONEY),
          monthlyExtra: parseCalcNumber(jeonseExtra, 0, MAX_MONEY),
        },
        monthly: {
          ownFunds: parseCalcNumber(monthlyOwn, 0, MAX_MONEY),
          loan: parseCalcNumber(monthlyLoan, 0, MAX_MONEY),
          returnRate: optionalRate(monthlyReturn),
          loanRate: optionalRate(monthlyLoanRate),
          oneTimeCost: parseCalcNumber(monthlyOneTime, 0, MAX_MONEY),
          monthlyExtra: parseCalcNumber(monthlyExtra, 0, MAX_MONEY),
          rent: parseCalcNumber(monthlyRent, 0, 1_000_000),
        },
      }),
    [
      returnRate, loanRate, periodMonths, jeonseOwn, jeonseLoan, jeonseReturn, jeonseLoanRate, jeonseOneTime, jeonseExtra,
      monthlyOwn, monthlyLoan, monthlyReturn, monthlyLoanRate, monthlyOneTime, monthlyExtra, monthlyRent,
    ],
  );

  const { jeonse, monthly } = result;
  const gap = formatCostManwon(Math.abs(result.monthlyDifference));
  const totalGap = formatCostManwon(Math.abs(result.totalDifference));

  const verdict =
    result.cheaper === 'EQUAL'
      ? '전세와 월세의 월 비용이 거의 같아요'
      : result.cheaper === 'JEONSE'
        ? `전세(대출)가 월 ${gap} 더 유리해요`
        : `월세가 월 ${gap} 더 유리해요`;

  const cost = (side: SideCost, pick: (side: SideCost) => number) => dash(pick(side));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5">
          <h2 className="text-base font-bold text-gray-900">공통 조건</h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              id="returnRate"
              label="내 자금 기대수익률 (연)"
              unit="%"
              step="0.1"
              value={returnRate}
              onChange={setReturnRate}
              hint="보증금을 은행에 맡겼다면 받았을 이자 (기회비용)"
            />
            <NumberField id="loanRate" label="대출 이율 (연)" unit="%" step="0.1" value={loanRate} onChange={setLoanRate} />
          </div>
          <NumberField id="months" label="비교 기간" unit="개월" value={months} onChange={setMonths} />
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-base font-bold text-gray-900">전세 조건</h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField id="jeonseOwn" label="내 자금" unit="만원" value={jeonseOwn} onChange={setJeonseOwn} />
            <NumberField
              id="jeonseLoan"
              label="대출금"
              unit="만원"
              value={jeonseLoan}
              onChange={setJeonseLoan}
              hint={`전세 보증금 ${formatCostManwon(result.jeonseDeposit)}`}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-base font-bold text-gray-900">월세 조건</h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField id="monthlyOwn" label="보증금 내 자금" unit="만원" value={monthlyOwn} onChange={setMonthlyOwn} />
            <NumberField
              id="monthlyLoan"
              label="보증금 대출금"
              unit="만원"
              value={monthlyLoan}
              onChange={setMonthlyLoan}
              hint={`월세 보증금 ${formatCostManwon(result.monthlyDeposit)}`}
            />
          </div>
          <NumberField id="monthlyRent" label="월세" unit="만원" step="0.1" value={monthlyRent} onChange={setMonthlyRent} />
        </Card>

        <Card className="flex flex-col gap-5">
          <button
            type="button"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center justify-between text-left text-base font-bold text-gray-900"
          >
            고급 계산 (개별 금리 · 일회성 비용)
            <span aria-hidden="true">{showAdvanced ? '▲' : '▼'}</span>
          </button>
          {showAdvanced && (
            <div className="flex flex-col gap-6">
              <p className="text-[13px] text-gray-500">비워두면 공통 조건을 그대로 써요. 일회성 비용은 비교 기간으로 나눠 월 비용에 넣어요.</p>
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-gray-900">전세</h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberField id="jeonseReturn" label="기대수익률" unit="%" step="0.1" value={jeonseReturn} onChange={setJeonseReturn} placeholder="공통 값" />
                  <NumberField id="jeonseLoanRate" label="대출 이율" unit="%" step="0.1" value={jeonseLoanRate} onChange={setJeonseLoanRate} placeholder="공통 값" />
                  <NumberField id="jeonseOneTime" label="일회성 비용" unit="만원" value={jeonseOneTime} onChange={setJeonseOneTime} hint="중개보수, 이사비 등" />
                  <NumberField id="jeonseExtra" label="월 추가비용" unit="만원" step="0.1" value={jeonseExtra} onChange={setJeonseExtra} hint="관리비 등" />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-gray-900">월세</h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberField id="monthlyReturn" label="기대수익률" unit="%" step="0.1" value={monthlyReturn} onChange={setMonthlyReturn} placeholder="공통 값" />
                  <NumberField id="monthlyLoanRate" label="대출 이율" unit="%" step="0.1" value={monthlyLoanRate} onChange={setMonthlyLoanRate} placeholder="공통 값" />
                  <NumberField id="monthlyOneTime" label="일회성 비용" unit="만원" value={monthlyOneTime} onChange={setMonthlyOneTime} hint="중개보수, 이사비 등" />
                  <NumberField id="monthlyExtra" label="월 추가비용" unit="만원" step="0.1" value={monthlyExtra} onChange={setMonthlyExtra} hint="관리비 등" />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="flex flex-col gap-5">
          <Verdict tone={result.cheaper === 'EQUAL' ? 'neutral' : 'primary'}>
            <p className="text-lg font-bold">{verdict}</p>
            {result.cheaper !== 'EQUAL' && (
              <p className="mt-1 text-[13px] font-normal text-gray-600">
                {periodMonths}개월 동안 약 {totalGap} 차이예요
              </p>
            )}
          </Verdict>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[13px] text-gray-500">
                <th className="pb-2 text-left font-medium" />
                <th className="pb-2 text-right font-medium">전세</th>
                <th className="pb-2 text-right font-medium">월세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <ResultRow label="대출 이자 (월)" jeonse={cost(jeonse, (s) => s.loanInterest)} monthly={cost(monthly, (s) => s.loanInterest)} />
              <ResultRow label="내 자금 기회비용 (월)" jeonse={cost(jeonse, (s) => s.opportunityCost)} monthly={cost(monthly, (s) => s.opportunityCost)} />
              <ResultRow label="월세" jeonse="-" monthly={cost(monthly, (s) => s.rent)} />
              <ResultRow label="월 추가비용" jeonse={cost(jeonse, (s) => s.monthlyExtra)} monthly={cost(monthly, (s) => s.monthlyExtra)} />
              <ResultRow label="일회성 비용 (월 환산)" jeonse={cost(jeonse, (s) => s.oneTimeMonthly)} monthly={cost(monthly, (s) => s.oneTimeMonthly)} />
              <ResultRow label="월 비용 합계" jeonse={formatCostManwon(jeonse.monthlyTotal)} monthly={formatCostManwon(monthly.monthlyTotal)} strong />
              <ResultRow label="연 비용 합계" jeonse={formatCostManwon(jeonse.monthlyTotal * 12)} monthly={formatCostManwon(monthly.monthlyTotal * 12)} />
              <ResultRow label={`${periodMonths}개월 비용 합계`} jeonse={formatCostManwon(jeonse.total)} monthly={formatCostManwon(monthly.total)} strong />
            </tbody>
          </table>

          <dl className="flex flex-col gap-1.5 rounded-lg bg-gray-50 p-4 text-[13px] text-gray-600">
            <div className="flex justify-between">
              <dt>월세 → 전세 환산 전환율</dt>
              <dd className="font-medium text-gray-900">
                {result.conversionRate === null ? '계산할 수 없어요' : `연 ${formatRate(result.conversionRate)}%`}
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-gray-500">
            기회비용은 보증금에 묶인 내 자금을 굴렸다면 벌 수 있었던 이자예요. 대출은 원금 상환 없이 월 이자만 계산하고, 중도상환수수료와 세금은
            포함하지 않아요. {CALC_DISCLAIMER}
          </p>
        </Card>
      </div>
    </div>
  );
}

export default RentCompareCalculator;

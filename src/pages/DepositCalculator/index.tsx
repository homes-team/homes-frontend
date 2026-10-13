import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import { Field, HelperText, Input, Label } from '../../components/ui/Field';
import { calculateDepositCost, formatCostManwon, parseCalcNumber } from '../../utils/depositCalculator';

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  step?: string;
}

function NumberField({ id, label, unit, value, onChange, hint, step = '1' }: NumberFieldProps) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          className="pr-14"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="absolute right-4 text-sm text-gray-500">{unit}</span>
      </div>
      {hint && <HelperText>{hint}</HelperText>}
    </Field>
  );
}

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

/** 전세대출 이자와 월세를 비교해 어느 쪽이 유리한지 계산하는 보증금 계산기 */
function DepositCalculatorPage() {
  const [searchParams] = useSearchParams();

  // 매물 상세에서 넘어오면 해당 매물의 가격으로 미리 채운다 (?jeonse=전세금 / ?deposit=보증금&rent=월세)
  const [jeonseDeposit, setJeonseDeposit] = useState(searchParams.get('jeonse') ?? '30000');
  const [loanRatio, setLoanRatio] = useState('70');
  const [loanRate, setLoanRate] = useState('4');
  const [monthlyDeposit, setMonthlyDeposit] = useState(searchParams.get('deposit') ?? '3000');
  const [monthlyRent, setMonthlyRent] = useState(searchParams.get('rent') ?? '90');
  const [savingsRate, setSavingsRate] = useState('3');
  const [years, setYears] = useState('2');

  const result = useMemo(
    () =>
      calculateDepositCost({
        jeonseDeposit: parseCalcNumber(jeonseDeposit, 0, 1_000_000),
        loanRatio: parseCalcNumber(loanRatio, 0, 100),
        loanRate: parseCalcNumber(loanRate, 0, 30),
        monthlyDeposit: parseCalcNumber(monthlyDeposit, 0, 1_000_000),
        monthlyRent: parseCalcNumber(monthlyRent, 0, 100_000),
        savingsRate: parseCalcNumber(savingsRate, 0, 30),
        years: parseCalcNumber(years, 1, 30),
      }),
    [jeonseDeposit, loanRatio, loanRate, monthlyDeposit, monthlyRent, savingsRate, years],
  );

  const termYears = parseCalcNumber(years, 1, 30);
  const { jeonse, monthly } = result;
  const gap = formatCostManwon(Math.abs(result.monthlyDifference));
  const termGap = formatCostManwon(Math.abs(result.totalOverTerm.monthly - result.totalOverTerm.jeonse));

  const verdict =
    result.cheaper === 'EQUAL'
      ? '전세와 월세의 월 비용이 거의 같아요'
      : result.cheaper === 'JEONSE'
        ? `전세(대출)가 월 ${gap} 더 유리해요`
        : `월세가 월 ${gap} 더 유리해요`;

  return (
    <PageShell>
      <h1 className="mb-2 text-xl font-bold text-gray-900">보증금 계산기</h1>
      <p className="mb-8 text-sm text-gray-500">전세대출 이자와 월세를 한 달 기준으로 비교해서 어느 쪽이 유리한지 알려드려요.</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <h2 className="text-base font-bold text-gray-900">전세 (대출 이용)</h2>
            <NumberField id="jeonseDeposit" label="전세 보증금" unit="만원" value={jeonseDeposit} onChange={setJeonseDeposit} />
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="loanRatio" label="대출 비율" unit="%" value={loanRatio} onChange={setLoanRatio} hint="전세금 중 대출로 마련하는 비율" />
              <NumberField id="loanRate" label="대출 금리 (연)" unit="%" step="0.1" value={loanRate} onChange={setLoanRate} />
            </div>
          </Card>

          <Card className="flex flex-col gap-5">
            <h2 className="text-base font-bold text-gray-900">월세</h2>
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="monthlyDeposit" label="월세 보증금" unit="만원" value={monthlyDeposit} onChange={setMonthlyDeposit} />
              <NumberField id="monthlyRent" label="월세" unit="만원" step="0.1" value={monthlyRent} onChange={setMonthlyRent} />
            </div>
          </Card>

          <Card className="flex flex-col gap-5">
            <h2 className="text-base font-bold text-gray-900">공통 가정</h2>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                id="savingsRate"
                label="예금 금리 (연)"
                unit="%"
                step="0.1"
                value={savingsRate}
                onChange={setSavingsRate}
                hint="보증금을 은행에 맡겼다면 받았을 이자 (기회비용)"
              />
              <NumberField id="years" label="거주 기간" unit="년" value={years} onChange={setYears} />
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="flex flex-col gap-5">
            <div className={`rounded-xl p-4 text-center ${result.cheaper === 'EQUAL' ? 'bg-gray-100' : 'bg-primary-50'}`} role="status">
              <p className={`text-lg font-bold ${result.cheaper === 'EQUAL' ? 'text-gray-900' : 'text-primary'}`}>{verdict}</p>
              {result.cheaper !== 'EQUAL' && (
                <p className="mt-1 text-[13px] text-gray-600">
                  {termYears}년 거주하면 약 {termGap} 차이예요
                </p>
              )}
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[13px] text-gray-500">
                  <th className="pb-2 text-left font-medium" />
                  <th className="pb-2 text-right font-medium">전세</th>
                  <th className="pb-2 text-right font-medium">월세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <ResultRow label="대출 이자 (월)" jeonse={formatCostManwon(jeonse.loanInterest)} monthly="-" />
                <ResultRow label="월세" jeonse="-" monthly={formatCostManwon(monthly.rent)} />
                <ResultRow label="보증금 기회비용 (월)" jeonse={formatCostManwon(jeonse.opportunityCost)} monthly={formatCostManwon(monthly.opportunityCost)} />
                <ResultRow label="월 비용 합계" jeonse={formatCostManwon(jeonse.monthlyTotal)} monthly={formatCostManwon(monthly.monthlyTotal)} strong />
                <ResultRow label="연 비용 합계" jeonse={formatCostManwon(jeonse.monthlyTotal * 12)} monthly={formatCostManwon(monthly.monthlyTotal * 12)} />
                <ResultRow label={`${termYears}년 비용 합계`} jeonse={formatCostManwon(result.totalOverTerm.jeonse)} monthly={formatCostManwon(result.totalOverTerm.monthly)} strong />
              </tbody>
            </table>

            <dl className="flex flex-col gap-1.5 rounded-lg bg-gray-50 p-4 text-[13px] text-gray-600">
              <div className="flex justify-between">
                <dt>전세 대출금 / 내 돈</dt>
                <dd className="font-medium text-gray-900">
                  {formatCostManwon(jeonse.loanAmount)} / {formatCostManwon(jeonse.ownCapital)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>월세 → 전세 환산 전환율</dt>
                <dd className="font-medium text-gray-900">
                  {result.conversionRate === null ? '계산할 수 없어요' : `연 ${result.conversionRate.toFixed(1)}%`}
                </dd>
              </div>
            </dl>

            <p className="text-xs leading-relaxed text-gray-500">
              기회비용은 목돈이 보증금으로 묶여 있지 않았다면 예금 등으로 벌 수 있었던 이자예요. 대출 원금 상환, 중도상환수수료, 관리비,
              세금은 포함하지 않은 단순 비교이니 참고용으로만 활용해주세요.
            </p>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export default DepositCalculatorPage;

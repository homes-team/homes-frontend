import { useMemo, useState } from 'react';
import Card from '../../../components/ui/Card';
import { formatRate, formatWon, parseCalcNumber } from '../../../utils/calcFormat';
import { calculateLoan, MAX_LOAN_MONTHS, RepaymentMethod } from '../../../utils/loanInterest';
import { CALC_DISCLAIMER, NumberField, ResultLine, ToggleGroup, Verdict } from './CalcFields';

const METHODS: ReadonlyArray<{ value: RepaymentMethod; label: string }> = [
  { value: 'ANNUITY', label: '원리금균등' },
  { value: 'EQUAL_PRINCIPAL', label: '원금균등' },
  { value: 'BULLET', label: '만기일시' },
];

const METHOD_DESCRIPTION: Record<RepaymentMethod, string> = {
  ANNUITY: '매달 같은 금액(원금+이자)을 내요. 초반에는 이자 비중이 커요.',
  EQUAL_PRINCIPAL: '매달 같은 원금을 내고 이자는 점점 줄어서, 첫 달이 가장 많이 나가요.',
  BULLET: '매달 이자만 내고 만기에 원금을 한 번에 갚아요.',
};

/** 처음 보여줄 상환 회차 수. 나머지는 "전체 보기"로 펼친다 */
const PREVIEW_ROWS = 12;

/** 대출 이자 계산기 — 상환 방식별 월 상환액, 총 이자, 상환 스케줄 */
function LoanInterestCalculator() {
  const [method, setMethod] = useState<RepaymentMethod>('ANNUITY');
  const [principal, setPrincipal] = useState('30000');
  const [annualRate, setAnnualRate] = useState('4');
  const [years, setYears] = useState('30');
  const [extraMonths, setExtraMonths] = useState('0');
  const [graceMonths, setGraceMonths] = useState('0');
  const [showAllRows, setShowAllRows] = useState(false);

  const totalMonths = Math.max(
    1,
    Math.min(
      MAX_LOAN_MONTHS,
      Math.round(parseCalcNumber(years, 0, 50)) * 12 + Math.round(parseCalcNumber(extraMonths, 0, 11)),
    ),
  );

  const result = useMemo(
    () =>
      calculateLoan({
        principal: parseCalcNumber(principal, 0, 100_000_000) * 10000,
        annualRate: parseCalcNumber(annualRate, 0, 100),
        months: totalMonths,
        graceMonths: parseCalcNumber(graceMonths, 0, MAX_LOAN_MONTHS),
        method,
      }),
    [principal, annualRate, totalMonths, graceMonths, method],
  );

  const principalWon = parseCalcNumber(principal, 0, 100_000_000) * 10000;
  const rows = showAllRows ? result.rows : result.rows.slice(0, PREVIEW_ROWS);
  const years12 = Math.floor(totalMonths / 12);
  const rest = totalMonths % 12;
  const termLabel = `${years12 > 0 ? `${years12}년 ` : ''}${rest > 0 ? `${rest}개월` : ''}`.trim();

  const headline =
    method === 'ANNUITY'
      ? { label: '월 상환액', value: formatWon(result.firstPayment) }
      : method === 'EQUAL_PRINCIPAL'
        ? { label: '첫 달 → 마지막 달 상환액', value: `${formatWon(result.firstPayment)} → ${formatWon(result.lastPayment)}` }
        : { label: '월 이자', value: formatWon(result.firstPayment) };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-gray-900">상환 방식</h2>
          <ToggleGroup label="상환 방식" value={method} options={METHODS} onChange={setMethod} />
          <p className="text-[13px] text-gray-500">{METHOD_DESCRIPTION[method]}</p>
        </Card>

        <Card className="flex flex-col gap-5">
          <NumberField id="loanPrincipal" label="대출 금액" unit="만원" value={principal} onChange={setPrincipal} />
          <NumberField id="loanRate" label="연 이율" unit="%" step="0.01" value={annualRate} onChange={setAnnualRate} />
          <div className="grid grid-cols-2 gap-4">
            <NumberField id="loanYears" label="대출 기간" unit="년" value={years} onChange={setYears} />
            <NumberField id="loanMonths" label="추가 개월" unit="개월" value={extraMonths} onChange={setExtraMonths} hint={`총 ${termLabel || '1개월'}`} />
          </div>
          {method !== 'BULLET' && (
            <NumberField
              id="loanGrace"
              label="거치 기간"
              unit="개월"
              value={graceMonths}
              onChange={setGraceMonths}
              hint="이자만 내는 기간이에요. 비워두면 처음부터 원금을 갚아요"
            />
          )}
        </Card>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="flex flex-col gap-5">
          <Verdict tone="primary">
            <p className="text-[13px] text-gray-600">{headline.label}</p>
            <p className="text-2xl font-bold text-primary">{headline.value}</p>
          </Verdict>

          <dl className="divide-y divide-gray-100">
            <ResultLine label="대출 원금" value={formatWon(principalWon)} />
            <ResultLine label="총 이자" value={formatWon(result.totalInterest)} strong />
            <ResultLine label="총 상환액" value={formatWon(result.totalPayment)} strong />
            <ResultLine
              label="원금 대비 이자"
              value={principalWon > 0 ? `${formatRate((result.totalInterest / principalWon) * 100)}%` : '-'}
            />
          </dl>

          <details className="rounded-lg bg-gray-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-gray-900">상환 스케줄 보기 ({result.rows.length}회차)</summary>
            <div className="mt-3 max-h-[420px] overflow-auto">
              <table className="w-full min-w-[420px] border-collapse text-[13px]">
                <thead className="sticky top-0 bg-gray-50 text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="py-1.5 text-left font-medium">회차</th>
                    <th className="py-1.5 text-right font-medium">원금</th>
                    <th className="py-1.5 text-right font-medium">이자</th>
                    <th className="py-1.5 text-right font-medium">납입액</th>
                    <th className="py-1.5 text-right font-medium">잔금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {rows.map((row) => (
                    <tr key={row.month}>
                      <td className="py-1.5">{row.month}</td>
                      <td className="py-1.5 text-right">{formatWon(row.principalPaid)}</td>
                      <td className="py-1.5 text-right">{formatWon(row.interest)}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900">{formatWon(row.payment)}</td>
                      <td className="py-1.5 text-right">{formatWon(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.rows.length > PREVIEW_ROWS && (
              <button
                type="button"
                onClick={() => setShowAllRows((prev) => !prev)}
                className="mt-3 text-[13px] font-bold text-primary underline"
              >
                {showAllRows ? '처음 12회차만 보기' : `전체 ${result.rows.length}회차 보기`}
              </button>
            )}
          </details>

          <p className="text-xs leading-relaxed text-gray-500">
            금융기관은 원 단위 반올림·절사 방식과 이자 계산일수가 달라서 실제 금액과 몇 원~몇 천 원 차이가 날 수 있어요. 중도상환수수료, 대출
            수수료, 금리 변동은 반영하지 않았어요. {CALC_DISCLAIMER}
          </p>
        </Card>
      </div>
    </div>
  );
}

export default LoanInterestCalculator;

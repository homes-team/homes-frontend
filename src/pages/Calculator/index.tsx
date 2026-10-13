import { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import AcquisitionTaxCalculator from './components/AcquisitionTaxCalculator';
import BrokerageFeeCalculator from './components/BrokerageFeeCalculator';
import LoanInterestCalculator from './components/LoanInterestCalculator';
import RentCompareCalculator from './components/RentCompareCalculator';
import RentConversionCalculator from './components/RentConversionCalculator';

export type CalculatorTab = 'commission' | 'conversion' | 'compare' | 'acquisition' | 'loan';

const TABS: ReadonlyArray<{ id: CalculatorTab; label: string; description: string }> = [
  { id: 'commission', label: '중개보수', description: '매매·전세·월세 거래의 중개수수료(복비) 법정 상한을 계산해요.' },
  { id: 'conversion', label: '전월세 전환', description: '전세와 월세를 전환율로 서로 바꿔 보고, 전환율을 역산해요.' },
  { id: 'compare', label: '전세 vs 월세', description: '전세대출 이자와 월세를 한 달 기준으로 비교해서 어느 쪽이 유리한지 알려드려요.' },
  { id: 'acquisition', label: '취득세', description: '주택·주택 외 부동산을 살 때 내는 취득세와 지방교육세, 농어촌특별세를 계산해요.' },
  { id: 'loan', label: '대출 이자', description: '원리금균등·원금균등·만기일시 상환 방식별 월 상환액과 총 이자를 계산해요.' },
];

function isTab(value: string | null): value is CalculatorTab {
  return TABS.some((tab) => tab.id === value);
}

/** 중개보수 · 전월세 전환 · 전세 vs 월세 계산기를 탭으로 묶은 부동산 계산기 */
function CalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const active: CalculatorTab = isTab(requested) ? requested : 'commission';
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];

  const selectTab = (tab: CalculatorTab) => setSearchParams({ tab }, { replace: true });

  // 좌우 화살표로 탭 이동 (키보드 접근성)
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    selectTab(next.id);
    document.getElementById(`calc-tab-${next.id}`)?.focus();
  };

  return (
    <PageShell>
      <h1 className="mb-6 text-xl font-bold text-gray-900">부동산 계산기</h1>

      <div role="tablist" aria-label="계산기 종류" className="mb-3 flex gap-2 overflow-x-auto overflow-y-hidden border-b border-gray-200">
        {TABS.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`calc-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="calc-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-[15px] font-bold transition-colors ${
                selected ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="mb-8 text-sm text-gray-500">{current.description}</p>

      <div id="calc-panel" role="tabpanel" aria-labelledby={`calc-tab-${active}`}>
        {active === 'commission' && <BrokerageFeeCalculator />}
        {active === 'conversion' && <RentConversionCalculator />}
        {active === 'compare' && <RentCompareCalculator />}
        {active === 'acquisition' && <AcquisitionTaxCalculator />}
        {active === 'loan' && <LoanInterestCalculator />}
      </div>
    </PageShell>
  );
}

export default CalculatorPage;

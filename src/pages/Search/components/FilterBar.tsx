import { useEffect, useRef, useState } from 'react';
import { SortBy, TradeType } from '../../../types/property';

/**
 * TradeType은 SALE까지 3종이다.
 * 전세·월세만 두면 매매 매물이 결과에 섞여 나오는데 토글로는 걸러낼 수 없다.
 */
const TRADE_TYPES: { label: string; value: TradeType }[] = [
  { label: '전세', value: 'JEONSE' },
  { label: '월세', value: 'MONTHLY_RENT' },
  { label: '매매', value: 'SALE' },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: '추천순', value: 'RECOMMENDED' },
  { label: '최신순', value: 'LATEST' },
  { label: '찜많은순', value: 'FAVORITE' },
];

interface FilterBarProps {
  total: number;
  loading: boolean;
  tradeType?: TradeType;
  onTradeTypeChange: (value?: TradeType) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  activeFilterCount: number;
  onOpenFilter: () => void;
}

function FilterBar({
  total,
  loading,
  tradeType,
  onTradeTypeChange,
  sortBy,
  onSortByChange,
  activeFilterCount,
  onOpenFilter,
}: FilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? '최신순';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-b border-gray-200 bg-white px-4 py-3">
      <p className="text-[13px] font-medium whitespace-nowrap text-gray-600">
        {loading ? (
          '검색 중...'
        ) : (
          <>
            총 <strong className="font-bold text-primary">{total}</strong>개의 방
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex rounded-md bg-gray-100 p-[3px]" role="group" aria-label="거래 유형">
          {TRADE_TYPES.map((type) => {
            const active = tradeType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                className={`rounded px-2.5 py-[5px] text-xs font-medium whitespace-nowrap ${
                  active ? 'bg-white font-bold text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-gray-500'
                }`}
                aria-pressed={active}
                // 같은 값을 다시 누르면 해제 → 전체 거래유형
                onClick={() => onTradeTypeChange(active ? undefined : type.value)}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-[7px] text-xs font-medium whitespace-nowrap text-gray-600 hover:border-gray-400"
            onClick={() => setSortOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
          >
            {sortLabel}
            <span className="text-[10px] leading-none" aria-hidden="true">
              ⌄
            </span>
          </button>

          {sortOpen && (
            <ul
              className="absolute top-[calc(100%+6px)] right-0 z-20 min-w-[130px] rounded-lg border border-gray-200 bg-white py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
              role="listbox"
            >
              {SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === sortBy}
                    className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium ${
                      option.value === sortBy ? 'bg-primary-50 font-bold text-primary' : 'text-gray-600'
                    }`}
                    onClick={() => {
                      onSortByChange(option.value);
                      setSortOpen(false);
                    }}
                  >
                    {option.label}
                    {option.value === sortBy && <span aria-hidden="true">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-[7px] text-xs font-medium whitespace-nowrap text-gray-600 hover:border-gray-400"
          onClick={onOpenFilter}
        >
          필터
          {activeFilterCount > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-pill bg-primary px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default FilterBar;

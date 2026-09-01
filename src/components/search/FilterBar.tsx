import { useEffect, useRef, useState } from 'react';
import { SortBy, TradeType } from '../../types/property';
import styles from './FilterBar.module.css';

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
    <div className={styles.bar}>
      <p className={styles.count}>
        {loading ? '검색 중...' : <>총 <strong>{total}</strong>개의 방</>}
      </p>

      <div className={styles.controls}>
        <div className={styles.segment} role="group" aria-label="거래 유형">
          {TRADE_TYPES.map((type) => {
            const active = tradeType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                className={`${styles.segmentItem} ${active ? styles.segmentItemActive : ''}`}
                aria-pressed={active}
                // 같은 값을 다시 누르면 해제 → 전체 거래유형
                onClick={() => onTradeTypeChange(active ? undefined : type.value)}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        <div className={styles.sort} ref={sortRef}>
          <button
            type="button"
            className={styles.sortButton}
            onClick={() => setSortOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
          >
            {sortLabel}
            <span className={styles.chevron} aria-hidden="true">
              ⌄
            </span>
          </button>

          {sortOpen && (
            <ul className={styles.sortMenu} role="listbox">
              {SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === sortBy}
                    className={`${styles.sortOption} ${
                      option.value === sortBy ? styles.sortOptionActive : ''
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

        <button type="button" className={styles.filterButton} onClick={onOpenFilter}>
          필터
          {activeFilterCount > 0 && <span className={styles.badge}>{activeFilterCount}</span>}
        </button>
      </div>
    </div>
  );
}

export default FilterBar;

import { useCallback, useMemo, useRef, useState } from 'react';
import { MapBounds, PropertyFilter } from '../api/propertyApi';
import Header from '../components/layout/Header';
import CategoryChips from '../components/search/CategoryChips';
import FilterBar from '../components/search/FilterBar';
import PropertyMap from '../components/search/PropertyMap';
import PropertyRow from '../components/search/PropertyRow';
import SearchBar, { PlaceSuggestion } from '../components/search/SearchBar';
import { usePropertySearch } from '../hooks/usePropertySearch';
import { PropertyType, SortBy, TradeType } from '../types/property';
import styles from './SearchPage.module.css';

/** 필터 모달에서 다루는 값들. 필터 적용 개수 뱃지 계산에 쓴다. */
type ModalFilter = Pick<
  PropertyFilter,
  'minDeposit' | 'maxDeposit' | 'minMonthlyRent' | 'maxMonthlyRent' | 'minArea' | 'maxArea' | 'options'
>;

function SearchPage() {
  const { items, loading, error, searched, search } = usePropertySearch();

  const [keyword, setKeyword] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [tradeType, setTradeType] = useState<TradeType | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortBy>('LATEST');
  const [modalFilter] = useState<ModalFilter>({});

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lng: number } | null>(null);
  const [boundsChanged, setBoundsChanged] = useState(false);

  /** 지도가 알려준 최신 영역. 값이 바뀌어도 리렌더가 필요 없어 ref로 둔다. */
  const boundsRef = useRef<MapBounds | null>(null);

  const filter: PropertyFilter = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      propertyType: propertyType ?? undefined,
      tradeType,
      sortBy,
      ...modalFilter,
    }),
    [keyword, propertyType, tradeType, sortBy, modalFilter],
  );

  /** 현재 지도 영역 + 현재 필터로 검색 */
  const runSearch = useCallback(
    (overrides: Partial<PropertyFilter> = {}) => {
      if (!boundsRef.current) return;
      setBoundsChanged(false);
      search({ ...boundsRef.current, ...filter, ...overrides });
    },
    [filter, search],
  );

  const handleBoundsChanged = useCallback(
    (bounds: MapBounds, isInitial: boolean) => {
      boundsRef.current = bounds;
      if (isInitial) {
        runSearch();
        return;
      }
      // 자동 재조회하지 않는다. 드래그 중 요청이 쏟아지는 것을 막고,
      // 사용자가 "이 지역에서 재검색"을 눌렀을 때만 결과를 갱신한다.
      setBoundsChanged(true);
    },
    [runSearch],
  );

  const handleSubmitKeyword = useCallback(
    (value: string, place?: PlaceSuggestion) => {
      setKeyword(value);
      if (place) {
        // 지도 이동 → idle → boundsChanged. 이동이 끝난 영역으로 검색해야 하므로
        // 여기서 바로 검색하지 않고 재검색 버튼을 띄운다.
        setMoveTo({ lat: place.lat, lng: place.lng });
        return;
      }
      runSearch({ keyword: value.trim() || undefined });
    },
    [runSearch],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.entries(modalFilter).filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== undefined,
      ).length,
    [modalFilter],
  );

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.body}>
        <aside className={styles.panel}>
          <div className={styles.searchSection}>
            <SearchBar value={keyword} onChange={setKeyword} onSubmit={handleSubmitKeyword} />
            <CategoryChips
              value={propertyType}
              onChange={(value) => {
                setPropertyType(value);
                runSearch({ propertyType: value ?? undefined });
              }}
            />
          </div>

          <FilterBar
            total={items.length}
            loading={loading}
            tradeType={tradeType}
            onTradeTypeChange={(value) => {
              setTradeType(value);
              runSearch({ tradeType: value });
            }}
            sortBy={sortBy}
            onSortByChange={(value) => {
              setSortBy(value);
              runSearch({ sortBy: value });
            }}
            activeFilterCount={activeFilterCount}
            onOpenFilter={() => {
              // 필터 모달은 다음 단계에서 연결한다
            }}
          />

          <div className={styles.list}>
            {error && (
              <div className={styles.message} role="alert">
                <p className={styles.messageTitle}>매물을 불러오지 못했습니다</p>
                <p className={styles.messageText}>{error}</p>
                <button type="button" className={styles.retry} onClick={() => runSearch()}>
                  다시 시도
                </button>
              </div>
            )}

            {!error && !loading && searched && items.length === 0 && (
              <div className={styles.message}>
                <p className={styles.messageTitle}>조건에 맞는 방이 없습니다</p>
                <p className={styles.messageText}>
                  지도를 넓히거나 필터를 줄여서 다시 찾아보세요.
                </p>
              </div>
            )}

            {!error && items.length > 0 && (
              <ul className={styles.rows}>
                {items.map((item) => (
                  <PropertyRow
                    key={item.propertyId}
                    property={item}
                    selected={item.propertyId === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        <PropertyMap
          items={items}
          selectedId={selectedId}
          onSelectProperty={setSelectedId}
          onBoundsChanged={handleBoundsChanged}
          showResearch={boundsChanged}
          onResearch={() => runSearch()}
          moveTo={moveTo}
        />
      </div>
    </div>
  );
}

export default SearchPage;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapBounds, PropertyFilter } from '../api/propertyApi';
import Header from '../components/layout/Header';
import CategoryChips from '../components/search/CategoryChips';
import FilterBar from '../components/search/FilterBar';
import FilterModal, { DetailFilter } from '../components/search/FilterModal';
import PropertyMap from '../components/search/PropertyMap';
import PropertyRow from '../components/search/PropertyRow';
import SearchBar, { PlaceSuggestion } from '../components/search/SearchBar';
import { usePropertySearch } from '../hooks/usePropertySearch';
import { PropertyOption, PropertyType, SortBy, TradeType } from '../types/property';
import styles from './SearchPage.module.css';

const PROPERTY_TYPES: PropertyType[] = ['ONE_ROOM', 'TWO_ROOM', 'VILLA', 'HOUSE', 'APARTMENT', 'OFFICETEL', 'PRESALE'];
const TRADE_TYPES: TradeType[] = ['MONTHLY_RENT', 'JEONSE', 'SALE'];
const SORT_TYPES: SortBy[] = ['RECOMMENDED', 'LATEST', 'FAVORITE'];
const PROPERTY_OPTIONS: PropertyOption[] = ['ELEVATOR', 'SECURITY_GUARD', 'PARKING', 'BED', 'DESK', 'AIR_CONDITIONER', 'REFRIGERATOR', 'WASHING_MACHINE', 'MICROWAVE', 'INDUCTION', 'GAS_STOVE', 'SHOE_RACK', 'CLOSET', 'SINK', 'VERANDA', 'FULL_OPTION'];

function readNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function readDetailFilter(params: URLSearchParams): DetailFilter {
  return {
    minDeposit: readNumber(params, 'minDeposit'),
    maxDeposit: readNumber(params, 'maxDeposit'),
    minMonthlyRent: readNumber(params, 'minMonthlyRent'),
    maxMonthlyRent: readNumber(params, 'maxMonthlyRent'),
    minArea: readNumber(params, 'minArea'),
    maxArea: readNumber(params, 'maxArea'),
    options: params.getAll('options').filter((value): value is PropertyOption => PROPERTY_OPTIONS.includes(value as PropertyOption)),
  };
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, error, searched, search } = usePropertySearch();
  const initialPropertyType = searchParams.get('propertyType');
  const initialTradeType = searchParams.get('tradeType');
  const initialSort = searchParams.get('sortBy');

  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType | null>(
    PROPERTY_TYPES.includes(initialPropertyType as PropertyType) ? initialPropertyType as PropertyType : null,
  );
  const [tradeType, setTradeType] = useState<TradeType | undefined>(
    TRADE_TYPES.includes(initialTradeType as TradeType) ? initialTradeType as TradeType : undefined,
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    SORT_TYPES.includes(initialSort as SortBy) ? initialSort as SortBy : 'LATEST',
  );
  const [detailFilter, setDetailFilter] = useState<DetailFilter>(() => readDetailFilter(searchParams));
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lng: number } | null>(null);
  const [boundsChanged, setBoundsChanged] = useState(false);
  const boundsRef = useRef<MapBounds | null>(null);
  const pendingPlaceSearchRef = useRef(false);
  const pendingPlaceKeywordRef = useRef<string | undefined>(undefined);
  const isUpdatingUrlRef = useRef(false);

  const filter: PropertyFilter = useMemo(() => ({
    keyword: keyword.trim() || undefined,
    propertyType: propertyType ?? undefined,
    tradeType,
    sortBy,
    ...detailFilter,
  }), [keyword, propertyType, tradeType, sortBy, detailFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (tradeType) params.set('tradeType', tradeType);
    if (sortBy !== 'LATEST') params.set('sortBy', sortBy);
    Object.entries(detailFilter).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
      else if (value !== undefined) params.set(key, String(value));
    });
    isUpdatingUrlRef.current = true;
    setSearchParams(params, { replace: true });
  }, [keyword, propertyType, tradeType, sortBy, detailFilter, setSearchParams]);

  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false;
      return;
    }
    const urlKeyword = searchParams.get('keyword') ?? '';
    const urlPropertyType = searchParams.get('propertyType');
    const urlTradeType = searchParams.get('tradeType');
    const urlSortBy = searchParams.get('sortBy');
    const urlDetailFilter = readDetailFilter(searchParams);

    setKeyword(urlKeyword);
    setPropertyType(PROPERTY_TYPES.includes(urlPropertyType as PropertyType) ? urlPropertyType as PropertyType : null);
    setTradeType(TRADE_TYPES.includes(urlTradeType as TradeType) ? urlTradeType as TradeType : undefined);
    setSortBy(SORT_TYPES.includes(urlSortBy as SortBy) ? urlSortBy as SortBy : 'LATEST');
    setDetailFilter(urlDetailFilter);

    if (boundsRef.current) {
      search({
        ...boundsRef.current,
        keyword: urlKeyword.trim() || undefined,
        propertyType: PROPERTY_TYPES.includes(urlPropertyType as PropertyType) ? urlPropertyType as PropertyType : undefined,
        tradeType: TRADE_TYPES.includes(urlTradeType as TradeType) ? urlTradeType as TradeType : undefined,
        sortBy: SORT_TYPES.includes(urlSortBy as SortBy) ? urlSortBy as SortBy : 'LATEST',
        ...urlDetailFilter,
      });
    }
  }, [searchParams, search]);

  useEffect(() => {
    if (selectedId !== null && !items.some((item) => item.propertyId === selectedId)) setSelectedId(null);
  }, [items, selectedId]);

  const runSearch = useCallback((overrides: Partial<PropertyFilter> = {}) => {
    if (!boundsRef.current) return;
    setBoundsChanged(false);
    search({ ...boundsRef.current, ...filter, ...overrides });
  }, [filter, search]);

  const handleBoundsChanged = useCallback((bounds: MapBounds, isInitial: boolean) => {
    boundsRef.current = bounds;
    if (isInitial || pendingPlaceSearchRef.current) {
      const keywordOverride = pendingPlaceSearchRef.current ? pendingPlaceKeywordRef.current : undefined;
      pendingPlaceSearchRef.current = false;
      pendingPlaceKeywordRef.current = undefined;
      runSearch(keywordOverride === undefined ? {} : { keyword: keywordOverride });
      return;
    }
    setBoundsChanged(true);
  }, [runSearch]);

  const handleSubmitKeyword = useCallback((value: string, place?: PlaceSuggestion) => {
    setKeyword(value);
    if (place) {
      pendingPlaceSearchRef.current = true;
      pendingPlaceKeywordRef.current = value.trim() || undefined;
      setMoveTo({ lat: place.lat, lng: place.lng });
      return;
    }
    runSearch({ keyword: value.trim() || undefined });
  }, [runSearch]);

  const activeFilterCount = useMemo(() => Object.values(detailFilter).reduce<number>(
    (count, value) => count + (Array.isArray(value) ? value.length : value === undefined ? 0 : 1), 0,
  ), [detailFilter]);

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <aside className={styles.panel}>
          <div className={styles.searchSection}>
            <SearchBar value={keyword} onChange={setKeyword} onSubmit={handleSubmitKeyword} />
            <CategoryChips value={propertyType} onChange={(value) => { setPropertyType(value); runSearch({ propertyType: value ?? undefined }); }} />
          </div>
          <FilterBar total={items.length} loading={loading} tradeType={tradeType}
            onTradeTypeChange={(value) => { setTradeType(value); runSearch({ tradeType: value }); }}
            sortBy={sortBy} onSortByChange={(value) => { setSortBy(value); runSearch({ sortBy: value }); }}
            activeFilterCount={activeFilterCount} onOpenFilter={() => setFilterOpen(true)} />
          <div className={styles.list}>
            {error && <div className={styles.message} role="alert"><p className={styles.messageTitle}>매물을 불러오지 못했습니다</p><p className={styles.messageText}>{error}</p><button type="button" className={styles.retry} onClick={() => runSearch()}>다시 시도</button></div>}
            {!error && !loading && searched && items.length === 0 && <div className={styles.message}><p className={styles.messageTitle}>조건에 맞는 방이 없습니다</p><p className={styles.messageText}>지역을 넓히거나 필터를 줄여서 다시 찾아보세요.</p></div>}
            {!error && items.length > 0 && <ul className={styles.rows}>{items.map((item) => <PropertyRow key={item.propertyId} property={item} selected={item.propertyId === selectedId} onSelect={setSelectedId} />)}</ul>}
          </div>
        </aside>
        <PropertyMap items={items} selectedId={selectedId} onSelectProperty={setSelectedId}
          onBoundsChanged={handleBoundsChanged} showResearch={boundsChanged} onResearch={() => runSearch()} moveTo={moveTo} />
      </div>
      <FilterModal open={filterOpen} value={detailFilter} onClose={() => setFilterOpen(false)} onApply={(value) => {
        setDetailFilter(value);
        setFilterOpen(false);
        if (boundsRef.current) {
          setBoundsChanged(false);
          search({
            ...boundsRef.current,
            keyword: keyword.trim() || undefined,
            propertyType: propertyType ?? undefined,
            tradeType,
            sortBy,
            minDeposit: value.minDeposit,
            maxDeposit: value.maxDeposit,
            minMonthlyRent: value.minMonthlyRent,
            maxMonthlyRent: value.maxMonthlyRent,
            minArea: value.minArea,
            maxArea: value.maxArea,
            options: value.options,
          });
        }
      }} />
    </div>
  );
}

export default SearchPage;

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapBounds, PropertyFilter } from '../../api/property/propertyApi';
import Header from '../../components/layout/Header';
import CategoryChips from './components/CategoryChips';
import FilterBar from './components/FilterBar';
import FilterModal, { DetailFilter } from './components/FilterModal';
import PropertyMap from './components/PropertyMap';
import PropertyRow from './components/PropertyRow';
import SearchBar, { PlaceSuggestion } from './components/SearchBar';
import { usePropertySearch } from '../../hooks/usePropertySearch';
import { findPlace } from '../../utils/placeSearch';
import { FILTER_OPTION_ORDER, PropertyOption, PropertyType, SortBy, TradeType } from '../../types/property';

const PROPERTY_TYPES: PropertyType[] = ['ONE_ROOM', 'TWO_ROOM', 'VILLA', 'HOUSE', 'APARTMENT', 'OFFICETEL', 'PRESALE'];
const TRADE_TYPES: TradeType[] = ['MONTHLY_RENT', 'JEONSE', 'SALE'];
const SORT_TYPES: SortBy[] = ['RECOMMENDED', 'LATEST', 'FAVORITE'];

type MobileSheetSnap = 'collapsed' | 'half' | 'expanded';

/** 세로 드래그 거리와 현재 단계로 모바일 매물 시트의 다음 고정 높이를 결정한다. */
export function resolveMobileSheetSnap(current: MobileSheetSnap, dragDeltaY: number): MobileSheetSnap {
  const snaps: MobileSheetSnap[] = ['collapsed', 'half', 'expanded'];
  const currentIndex = snaps.indexOf(current);
  if (dragDeltaY <= -40) return snaps[Math.min(currentIndex + 1, snaps.length - 1)];
  if (dragDeltaY >= 40) return snaps[Math.max(currentIndex - 1, 0)];
  return current;
}

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
    minMaintenanceFee: readNumber(params, 'minMaintenanceFee'),
    maxMaintenanceFee: readNumber(params, 'maxMaintenanceFee'),
    minArea: readNumber(params, 'minArea'),
    maxArea: readNumber(params, 'maxArea'),
    options: params.getAll('options').filter((value): value is PropertyOption => FILTER_OPTION_ORDER.includes(value as PropertyOption)),
  };
}

function SearchPage() {
  const navigate = useNavigate();
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
  const [mobileSheetSnap, setMobileSheetSnap] = useState<MobileSheetSnap>('collapsed');
  const boundsRef = useRef<MapBounds | null>(null);
  const sheetDragStartYRef = useRef<number | null>(null);
  const sheetWasDraggedRef = useRef(false);
  /**
   * 지도를 열 처음 위치. undefined면 검색어가 가리키는 장소를 찾는 중이라 지도를 아직 만들지 않는다.
   * (먼저 강남역에서 열고 옮기면 엉뚱한 지역을 한 번 검색하게 된다)
   */
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null | undefined>(
    () => (searchParams.get('keyword')?.trim() ? undefined : null),
  );
  /** 장소(지하철역 등)로 해석해 지도를 옮긴 검색어. 이 검색어는 주소·제목 글자 검색에 쓰지 않는다 */
  const [placeKeyword, setPlaceKeyword] = useState<string | null>(null);
  const pendingPlaceSearchRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);

  const filter: PropertyFilter = useMemo(() => ({
    keyword: keyword.trim() && keyword.trim() !== placeKeyword ? keyword.trim() : undefined,
    propertyType: propertyType ?? undefined,
    tradeType,
    sortBy,
    ...detailFilter,
  }), [keyword, placeKeyword, propertyType, tradeType, sortBy, detailFilter]);

  useEffect(() => {
    const initialKeyword = searchParams.get('keyword')?.trim();
    if (!initialKeyword) return;
    let cancelled = false;
    findPlace(initialKeyword)
      .then((place) => {
        if (cancelled) return;
        if (place) setPlaceKeyword(initialKeyword);
        setInitialCenter(place ? { lat: place.lat, lng: place.lng } : null);
      })
      .catch(() => !cancelled && setInitialCenter(null));
    return () => {
      cancelled = true;
    };
    // 처음 들어온 주소의 검색어만 처리한다
  }, []);

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
      // 장소로 옮긴 검색은 위치로만 찾는다 (글자 검색을 겹치면 "창동역"이 들어간 주소만 남아 거의 비어버린다)
      runSearch(pendingPlaceSearchRef.current ? { keyword: undefined } : {});
      pendingPlaceSearchRef.current = false;
      return;
    }
    setBoundsChanged(true);
  }, [runSearch]);

  const handleSubmitKeyword = useCallback(async (value: string, place?: PlaceSuggestion) => {
    const trimmed = value.trim();
    setKeyword(value);
    // 자동완성을 고르지 않고 엔터만 쳐도, 지하철역·동네 같은 장소면 그 위치로 지도를 옮긴다
    const target = place ?? (trimmed ? await findPlace(trimmed).catch(() => null) : null);
    if (target) {
      setPlaceKeyword(trimmed);
      pendingPlaceSearchRef.current = true;
      setMoveTo({ lat: target.lat, lng: target.lng });
      return;
    }
    setPlaceKeyword(null);
    runSearch({ keyword: trimmed || undefined });
  }, [runSearch]);

  const activeFilterCount = useMemo(() => Object.values(detailFilter).reduce<number>(
    (count, value) => count + (Array.isArray(value) ? value.length : value === undefined ? 0 : 1), 0,
  ), [detailFilter]);

  const mobileSheetHeight = {
    collapsed: 'h-[112px]',
    half: 'h-[48%]',
    expanded: 'h-[78%]',
  }[mobileSheetSnap];

  const cycleMobileSheet = () => {
    if (sheetWasDraggedRef.current) {
      sheetWasDraggedRef.current = false;
      return;
    }
    setMobileSheetSnap((current) => (
      current === 'collapsed' ? 'half' : current === 'half' ? 'expanded' : 'collapsed'
    ));
  };

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    sheetDragStartYRef.current = event.clientY;
    sheetWasDraggedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSheetPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (sheetDragStartYRef.current === null) return;
    const dragDeltaY = event.clientY - sheetDragStartYRef.current;
    sheetDragStartYRef.current = null;
    if (Math.abs(dragDeltaY) < 40) return;
    sheetWasDraggedRef.current = true;
    setMobileSheetSnap((current) => resolveMobileSheetSnap(current, dragDeltaY));
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <Header />
      <div className="relative flex min-h-0 flex-1">
        <aside className="pointer-events-none absolute inset-0 z-10 flex flex-col md:relative md:inset-auto md:z-auto md:w-[380px] md:shrink-0 md:border-r md:border-gray-200 md:bg-white md:pointer-events-auto lg:w-[480px]">
          <div className="pointer-events-auto absolute top-3 right-3 left-3 z-10 flex flex-col gap-2 rounded-2xl bg-white/95 p-3 shadow-[0_6px_24px_rgba(15,23,42,0.14)] backdrop-blur md:static md:rounded-none md:bg-white md:px-4 md:pt-4 md:pb-3.5 md:shadow-none md:backdrop-blur-none">
            <SearchBar value={keyword} onChange={setKeyword} onSubmit={handleSubmitKeyword} />
            <CategoryChips value={propertyType} onChange={(value) => { setPropertyType(value); runSearch({ propertyType: value ?? undefined }); }} />
          </div>
          <div
            className={`pointer-events-auto absolute right-0 bottom-0 left-0 flex min-h-0 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.18)] transition-[height] duration-300 ease-out ${mobileSheetHeight} md:static md:h-auto md:min-h-0 md:flex-1 md:rounded-none md:shadow-none`}
            data-testid="mobile-property-sheet"
            data-snap={mobileSheetSnap}
          >
            <button
              type="button"
              className="flex h-8 shrink-0 touch-none items-center justify-center md:hidden"
              aria-label={mobileSheetSnap === 'expanded' ? '매물 목록 접기' : '매물 목록 펼치기'}
              aria-expanded={mobileSheetSnap !== 'collapsed'}
              onClick={cycleMobileSheet}
              onPointerDown={handleSheetPointerDown}
              onPointerUp={handleSheetPointerUp}
            >
              <span className="h-1.5 w-12 rounded-full bg-gray-300" aria-hidden="true" />
            </button>
            <FilterBar total={items.length} loading={loading} tradeType={tradeType}
              onTradeTypeChange={(value) => { setTradeType(value); runSearch({ tradeType: value }); }}
              sortBy={sortBy} onSortByChange={(value) => { setSortBy(value); runSearch({ sortBy: value }); }}
              activeFilterCount={activeFilterCount} onOpenFilter={() => setFilterOpen(true)} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {error && (
                <div className="flex flex-col items-center gap-2 px-6 py-15 text-center" role="alert">
                  <p className="text-[15px] font-bold text-gray-900">매물을 불러오지 못했습니다</p>
                  <p className="text-[13px] leading-relaxed text-gray-500">{error}</p>
                  <button
                    type="button"
                    className="mt-1.5 rounded-md border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:border-gray-400"
                    onClick={() => runSearch()}
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {!error && !loading && searched && items.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-15 text-center">
                  <p className="text-[15px] font-bold text-gray-900">조건에 맞는 방이 없습니다</p>
                  <p className="text-[13px] leading-relaxed text-gray-500">지역을 넓히거나 필터를 줄여서 다시 찾아보세요.</p>
                </div>
              )}
              {!error && items.length > 0 && (
                <ul className="m-0 list-none p-0">
                  {items.map((item) => (
                    <PropertyRow
                      key={item.propertyId}
                      property={item}
                      selected={item.propertyId === selectedId}
                      onOpen={(propertyId) => navigate(`/properties/${propertyId}`)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
        {initialCenter === undefined ? (
          <div className="flex-1" aria-hidden="true" />
        ) : (
          <PropertyMap items={items} selectedId={selectedId} onSelectProperty={setSelectedId}
            onOpenProperty={(propertyId) => navigate(`/properties/${propertyId}`)}
            onBoundsChanged={handleBoundsChanged} showResearch={boundsChanged} onResearch={() => runSearch()} moveTo={moveTo}
            initialCenter={initialCenter ?? undefined} />
        )}
      </div>
      <FilterModal open={filterOpen} value={detailFilter} onClose={() => setFilterOpen(false)} onApply={(value) => {
        setDetailFilter(value);
        setFilterOpen(false);
        if (boundsRef.current) {
          setBoundsChanged(false);
          search({
            ...boundsRef.current,
            keyword: filter.keyword,
            propertyType: propertyType ?? undefined,
            tradeType,
            sortBy,
            ...value,
          });
        }
      }} />
    </div>
  );
}

export default SearchPage;

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { findPlace } from '../../utils/placeSearch';
import SearchPage, { resolveMobileSheetSnap } from './index';

const search = vi.hoisted(() => vi.fn());
const mapProps = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
const searchResult = vi.hoisted(() => ({
  items: [] as Record<string, any>[],
  loading: false,
  error: null as string | null,
  searched: false,
}));

vi.mock('../../utils/placeSearch', () => ({ findPlace: vi.fn() }));
vi.mock('../../hooks/usePropertySearch', () => ({
  usePropertySearch: () => ({ ...searchResult, search }),
}));
vi.mock('../../components/layout/Header', () => ({ default: () => null }));
vi.mock('./components/CategoryChips', () => ({ default: () => null }));
vi.mock('./components/FilterBar', () => ({ default: () => null }));
vi.mock('./components/FilterModal', () => ({ default: () => null }));
vi.mock('./components/PropertyRow', () => ({
  default: ({ property, onOpen }: { property: { propertyId: number; title: string }; onOpen: (propertyId: number) => void }) => (
    <button type="button" onClick={() => onOpen(property.propertyId)}>{property.title}</button>
  ),
}));
vi.mock('./components/SearchBar', () => ({
  default: ({ onSubmit }: { onSubmit: (keyword: string) => void }) => (
    <button type="button" onClick={() => onSubmit('창동역')}>엔터</button>
  ),
}));
vi.mock('./components/PropertyMap', () => ({
  default: (props: Record<string, any>) => {
    mapProps.current = props;
    return <button type="button" onClick={() => props.onBoundsChanged({ swLat: 1, swLng: 2, neLat: 3, neLng: 4 }, true)}>지도 준비</button>;
  },
}));

const CHANGDONG = { id: '1', name: '창동역 1호선', address: '서울 도봉구 창동', lat: 37.653, lng: 127.047 };

const renderSearch = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/properties/:propertyId" element={<p>매물 상세 화면</p>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  mapProps.current = null;
  searchResult.items = [];
  searchResult.loading = false;
  searchResult.error = null;
  searchResult.searched = false;
});

describe('SearchPage mobile layout', () => {
  it('changes the property bottom sheet through its responsive snap points', () => {
    renderSearch('/search');
    const sheet = screen.getByTestId('mobile-property-sheet');

    expect(sheet).toHaveAttribute('data-snap', 'collapsed');
    fireEvent.click(screen.getByRole('button', { name: '매물 목록 펼치기' }));
    expect(sheet).toHaveAttribute('data-snap', 'half');
    fireEvent.click(screen.getByRole('button', { name: '매물 목록 펼치기' }));
    expect(sheet).toHaveAttribute('data-snap', 'expanded');
    fireEvent.click(screen.getByRole('button', { name: '매물 목록 접기' }));
    expect(sheet).toHaveAttribute('data-snap', 'collapsed');
  });

  it('moves one snap point at a time when the handle is swiped', () => {
    expect(resolveMobileSheetSnap('collapsed', -80)).toBe('half');
    expect(resolveMobileSheetSnap('half', -80)).toBe('expanded');
    expect(resolveMobileSheetSnap('expanded', 80)).toBe('half');
    expect(resolveMobileSheetSnap('collapsed', 80)).toBe('collapsed');
  });

  it('opens the detail route when a property row is selected', () => {
    searchResult.items = [{ propertyId: 75, title: '모바일 테스트 매물' }];
    searchResult.searched = true;
    renderSearch('/search');

    fireEvent.click(screen.getByRole('button', { name: '모바일 테스트 매물' }));

    expect(screen.getByText('매물 상세 화면')).toBeInTheDocument();
  });
});

describe('SearchPage keyword from the home search', () => {
  it('opens the map on the place the keyword points to instead of the default Gangnam', async () => {
    vi.mocked(findPlace).mockResolvedValue(CHANGDONG);
    renderSearch('/search?keyword=창동역');

    fireEvent.click(await screen.findByRole('button', { name: '지도 준비' }));

    expect(mapProps.current?.initialCenter).toEqual({ lat: 37.653, lng: 127.047 });
    // 장소로 찾은 검색어를 주소·제목 글자 검색으로 또 걸면 결과가 비어버린다
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ swLat: 1, keyword: undefined }));
  });

  it('keeps the keyword as a text filter when it is not a place', async () => {
    vi.mocked(findPlace).mockResolvedValue(null);
    renderSearch('/search?keyword=에어컨');

    fireEvent.click(await screen.findByRole('button', { name: '지도 준비' }));

    expect(mapProps.current?.initialCenter).toBeUndefined();
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ keyword: '에어컨' }));
  });

  it('does not wait for a place lookup when there is no keyword', () => {
    renderSearch('/search');

    expect(screen.getByRole('button', { name: '지도 준비' })).toBeInTheDocument();
    expect(findPlace).not.toHaveBeenCalled();
  });
});

describe('SearchPage submitting a keyword', () => {
  it('moves the map to the place even when no suggestion was picked', async () => {
    vi.mocked(findPlace).mockResolvedValue(CHANGDONG);
    renderSearch('/search');

    fireEvent.click(screen.getByRole('button', { name: '엔터' }));

    await waitFor(() => expect(mapProps.current?.moveTo).toEqual({ lat: 37.653, lng: 127.047 }));
  });
});

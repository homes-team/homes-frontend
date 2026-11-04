import { act, fireEvent, render, screen } from '@testing-library/react';
import { loadKakaoMapSdk } from '../../../utils/KakaoLoader';
import SearchBar from './SearchBar';

vi.mock('../../../utils/KakaoLoader', () => ({
  loadKakaoMapSdk: vi.fn(),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  function mockPlaceSearch() {
    vi.mocked(loadKakaoMapSdk).mockResolvedValue({
      services: {
        Places: class {
          keywordSearch(_keyword: string, callback: (result: Array<Record<string, string>>, status: string) => void) {
            callback([{
              id: 'place-1',
              place_name: '반포역',
              road_address_name: '서울 서초구 신반포로',
              address_name: '',
              x: '127.011',
              y: '37.508',
            }], 'OK');
          }
        },
        Status: { OK: 'OK' },
      },
    } as never);
  }

  async function showSuggestions() {
    fireEvent.focus(screen.getByRole('combobox', { name: '매물 검색' }));
    await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
    });
  }

  it('활성 자동완성이 없으면 Enter로 현재 검색어를 제출한다', async () => {
    const onSubmit = vi.fn();
    mockPlaceSearch();

    render(<SearchBar value="반포역" onChange={vi.fn()} onSubmit={onSubmit} />);
    await showSuggestions();

    fireEvent.keyDown(screen.getByRole('combobox', { name: '매물 검색' }), { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('반포역');
  });

  it('키보드로 활성화한 자동완성은 Enter로 선택한다', async () => {
    const onSubmit = vi.fn();
    mockPlaceSearch();

    render(<SearchBar value="반포역" onChange={vi.fn()} onSubmit={onSubmit} />);
    await showSuggestions();
    const input = screen.getByRole('combobox', { name: '매물 검색' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('반포역', {
      id: 'place-1',
      name: '반포역',
      address: '서울 서초구 신반포로',
      lat: 37.508,
      lng: 127.011,
    });
  });

  it('IME 조합 중 Enter는 검색을 제출하지 않는다', () => {
    const onSubmit = vi.fn();
    render(<SearchBar value="반포" onChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.keyDown(screen.getByRole('combobox', { name: '매물 검색' }), {
      key: 'Enter',
      isComposing: true,
      keyCode: 13,
    });
    fireEvent.keyDown(screen.getByRole('combobox', { name: '매물 검색' }), {
      key: 'Enter',
      isComposing: false,
      keyCode: 229,
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

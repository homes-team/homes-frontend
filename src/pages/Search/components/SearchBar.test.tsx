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

  it('자동완성 결과가 있으면 Enter로 첫 번째 장소를 선택한다', async () => {
    const onSubmit = vi.fn();
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

    render(<SearchBar value="반포역" onChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.focus(screen.getByRole('combobox', { name: '매물 검색' }));
    await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
    });

    fireEvent.keyDown(screen.getByRole('combobox', { name: '매물 검색' }), { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('반포역', {
      id: 'place-1',
      name: '반포역',
      address: '서울 서초구 신반포로',
      lat: 37.508,
      lng: 127.011,
    });
  });
});

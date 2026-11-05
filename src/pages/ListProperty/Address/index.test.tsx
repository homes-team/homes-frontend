import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { geocodeAddress } from '../../../api/property/listPropertyApi';
import { ListPropertyProvider } from '../../../context/ListPropertyContext';
import ListPropertyAddressPage from './index';

vi.mock('../../../api/property/listPropertyApi', () => ({ geocodeAddress: vi.fn() }));
vi.mock('../components/AddressSearchModal', () => ({
  default: ({ onSelect }: { onSelect: (address: string) => void }) => (
    <button type="button" onClick={() => onSelect('서울 노원구 석계로 49')}>검색 결과 선택</button>
  ),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ListPropertyProvider>
        <ListPropertyAddressPage />
      </ListPropertyProvider>
    </MemoryRouter>,
  );

beforeEach(() => vi.resetAllMocks());

describe('ListPropertyAddressPage', () => {
  it('fills in the address chosen from the search and confirms it right away', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue({ lat: 37.6, lng: 127.0 });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    fireEvent.click(screen.getByRole('button', { name: '검색 결과 선택' }));

    expect(await screen.findByText('✓ 주소가 확인되었어요')).toBeInTheDocument();
    expect(screen.getByLabelText(/^주소/)).toHaveValue('서울 노원구 석계로 49');
    expect(geocodeAddress).toHaveBeenCalledWith('서울 노원구 석계로 49');
  });

  it('asks for another search when the chosen address has no location', async () => {
    vi.mocked(geocodeAddress).mockResolvedValue(null);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    fireEvent.click(screen.getByRole('button', { name: '검색 결과 선택' }));

    expect(await screen.findByText(/위치를 찾을 수 없어요/)).toBeInTheDocument();
    expect(screen.queryByText('✓ 주소가 확인되었어요')).not.toBeInTheDocument();
  });

  it('does not let the address be typed by hand', () => {
    renderPage();

    expect(screen.getByLabelText(/^주소/)).toHaveAttribute('readonly');
  });
});

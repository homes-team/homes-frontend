import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { createProperty } from '../../../api/property/listPropertyApi';
import ListPropertyFeePage from './index';

const resetForm = vi.hoisted(() => vi.fn());

vi.mock('../../../api/client', () => ({ isLoggedIn: () => true }));
vi.mock('../../../api/property/listPropertyApi', () => ({
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
}));
vi.mock('../../../context/ListPropertyContext', () => ({
  useListPropertyForm: () => ({
    form: {
      tradeType: 'MONTHLY_RENT',
      propertyType: 'ONE_ROOM',
      deposit: '1000',
      monthlyRent: '60',
      maintenanceFee: '5',
      maintenanceItems: [],
      address: '서울시 도봉구 창동',
      detailAddress: '101호',
      currentFloor: '1',
      totalFloors: '5',
      direction: 'SOUTH',
      remodelingYear: '',
      area: '24',
      description: '등록 완료 이동 테스트',
      desiredBrokerageFee: '',
      options: [],
      latitude: 37.653,
      longitude: 127.047,
      images: [],
    },
    updateForm: vi.fn(),
    resetForm,
    editingPropertyId: null,
  }),
}));
vi.mock('../components/WizardShell', () => ({
  default: ({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) => (
    <main><h1>{title}</h1>{children}{footer}</main>
  ),
}));

function PropertyDetailStub() {
  const { propertyId } = useParams();
  return <p>생성된 매물 ID: {propertyId}</p>;
}

describe('ListPropertyFeePage', () => {
  it('opens the newly created property instead of the home page', async () => {
    vi.mocked(createProperty).mockResolvedValue(321);
    render(
      <MemoryRouter initialEntries={['/list-property/fee']}>
        <Routes>
          <Route path="/list-property/fee" element={<ListPropertyFeePage />} />
          <Route path="/properties/:propertyId" element={<PropertyDetailStub />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '매물 등록하기' }));
    fireEvent.click(await screen.findByRole('button', { name: '등록한 매물 보기' }));

    expect(screen.getByText('생성된 매물 ID: 321')).toBeInTheDocument();
    expect(resetForm).toHaveBeenCalledOnce();
  });
});

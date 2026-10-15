import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CompareProvider } from '../../context/CompareContext';
import CompareToggleButton from './CompareToggleButton';
import CompareTray from './CompareTray';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

function setup(path = '/search') {
  localStorage.clear();
  const onRowClick = vi.fn();
  render(
    <MemoryRouter initialEntries={[path]}>
      <CompareProvider>
        <div onClick={onRowClick}>
          {[1, 2, 3, 4].map((id) => (
            <CompareToggleButton key={id} size="row" item={{ propertyId: id, title: `매물 ${id}` }} />
          ))}
        </div>
        <CompareTray />
      </CompareProvider>
    </MemoryRouter>,
  );
  return { onRowClick, buttons: () => screen.getAllByRole('button', { name: /비교/ }) };
}

beforeEach(() => vi.clearAllMocks());

describe('compare tray', () => {
  it('stays hidden until something is added, then guides the user to add a second property', () => {
    setup();
    expect(screen.queryByRole('region', { name: '비교 목록' })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: '＋ 비교 담기' })[0]);
    expect(screen.getByRole('region', { name: '비교 목록' })).toBeInTheDocument();
    expect(screen.getByText('비교 1/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2개 이상 담아주세요' })).toBeDisabled();
  });

  it('opens the compare page once two properties are added', () => {
    setup();
    const add = () => screen.getAllByRole('button', { name: '＋ 비교 담기' })[0];
    fireEvent.click(add());
    fireEvent.click(add());

    fireEvent.click(screen.getByRole('button', { name: '비교하기' }));
    expect(navigate).toHaveBeenCalledWith('/compare');
  });

  it('does not let the click bubble to the parent row and blocks a 4th property', () => {
    const { onRowClick } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getAllByRole('button', { name: '＋ 비교 담기' })[0]);

    expect(onRowClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '＋ 비교 담기' })).toBeDisabled();
  });

  it('removes a property from the tray', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button', { name: '＋ 비교 담기' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '매물 1 비교에서 빼기' }));
    expect(screen.queryByRole('region', { name: '비교 목록' })).not.toBeInTheDocument();
  });

  it('is hidden on the compare page itself', () => {
    setup('/compare');
    fireEvent.click(screen.getAllByRole('button', { name: '＋ 비교 담기' })[0]);
    expect(screen.queryByRole('region', { name: '비교 목록' })).not.toBeInTheDocument();
  });
});

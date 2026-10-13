import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { PropertyRealtor, PropertyRealtorInfo } from '../../../types/realtor';
import RealtorContactCard, { toTelHref } from './RealtorContactCard';

const fetchPropertyRealtorInfo = vi.hoisted(() => vi.fn());
const createChatRoom = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock('../../../api/property/propertyApi', () => ({ fetchPropertyRealtorInfo }));
vi.mock('../../../api/chat/chatApi', () => ({ createChatRoom }));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

const agent: PropertyRealtor = { agentId: 7, officeName: '홈즈공인중개사', officeAddress: '서울 강남구 역삼동', isVerified: true };

function info(overrides: Partial<PropertyRealtor> | null): PropertyRealtorInfo {
  return { agent: overrides === null ? null : { ...agent, ...overrides }, otherProperties: [] };
}

function login(role: 'USER' | 'AGENT') {
  const payload = btoa(JSON.stringify({ sub: '1', email: 'a@a.com', role, exp: 9999999999 }));
  localStorage.setItem('accessToken', `h.${payload}.s`);
}

function renderCard() {
  return render(<MemoryRouter><RealtorContactCard propertyId={21} /></MemoryRouter>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('toTelHref', () => {
  it('keeps only digits and +', () => {
    expect(toTelHref('010-1234-5678')).toBe('tel:01012345678');
    expect(toTelHref('+82 2-123-4567')).toBe('tel:+8221234567');
  });
});

describe('RealtorContactCard', () => {
  it('renders nothing when no realtor is matched yet', async () => {
    fetchPropertyRealtorInfo.mockResolvedValue(info(null));
    const { container } = renderCard();
    await waitFor(() => expect(fetchPropertyRealtorInfo).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a call link when the realtor phone is provided', async () => {
    fetchPropertyRealtorInfo.mockResolvedValue(info({ phone: '02-123-4567' }));
    renderCard();
    expect(await screen.findByRole('link', { name: /전화하기/ })).toHaveAttribute('href', 'tel:021234567');
    expect(screen.getByText('인증 중개사')).toBeInTheDocument();
  });

  it('shows a disabled placeholder while the backend does not return a phone number', async () => {
    fetchPropertyRealtorInfo.mockResolvedValue(info({}));
    renderCard();
    expect(await screen.findByRole('button', { name: /전화번호 준비 중/ })).toBeDisabled();
  });

  it('opens a chat room for a logged-in user', async () => {
    login('USER');
    fetchPropertyRealtorInfo.mockResolvedValue(info({}));
    createChatRoom.mockResolvedValue({ chatId: 55 });
    renderCard();

    fireEvent.click(await screen.findByRole('button', { name: /채팅 문의/ }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/chats/55'));
    expect(createChatRoom).toHaveBeenCalledWith({ propertyId: 21, realtorId: 7 });
  });

  it('explains why the chat could not be opened when the backend rejects non-owners', async () => {
    login('USER');
    fetchPropertyRealtorInfo.mockResolvedValue(info({}));
    createChatRoom.mockRejectedValue(new ApiError('PROP403_1', '해당 매물을 수정/삭제 권한이 없습니다.'));
    renderCard();

    fireEvent.click(await screen.findByRole('button', { name: /채팅 문의/ }));

    expect(await screen.findByText(/집주인만 중개사와 채팅을 시작할 수 있어요/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends visitors to the login page and hides the chat button from realtors', async () => {
    fetchPropertyRealtorInfo.mockResolvedValue(info({}));
    const { unmount } = renderCard();
    fireEvent.click(await screen.findByRole('button', { name: /채팅 문의/ }));
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(createChatRoom).not.toHaveBeenCalled();
    unmount();

    login('AGENT');
    renderCard();
    await screen.findByText('홈즈공인중개사');
    expect(screen.queryByRole('button', { name: /채팅 문의/ })).not.toBeInTheDocument();
  });
});

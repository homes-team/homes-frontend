import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fetchMyProfile } from '../../api/user/userApi';
import { UserProfile } from '../../types/auth';
import { saveTokens } from '../../utils/auth';
import MyPage from './index';

vi.mock('../../api/user/userApi', () => ({
  fetchMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  updateMyPassword: vi.fn(),
  deleteMyAccount: vi.fn(),
}));
vi.mock('../../api/auth/authApi', () => ({ verifyIdentity: vi.fn() }));
vi.mock('../../utils/identityVerification', () => ({
  parseIdentityRedirect: () => null,
  requestIdentityVerification: vi.fn(),
}));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('./components/MyPageNav', () => ({ default: () => null }));

const profile: UserProfile = {
  userId: 1, email: 'a@a.com', name: null, nickname: '닉', phone: null, usagePurpose: null, isIdentityVerified: true, role: 'USER',
};
const tokens = { accessToken: 'a', refreshToken: 'r' } as Parameters<typeof saveTokens>[0];

const renderPage = () => render(<MemoryRouter><MyPage /></MemoryRouter>);

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(fetchMyProfile).mockResolvedValue(profile);
});

describe('MyPage password change', () => {
  it('shows the password form to an account that signed in with a password', async () => {
    saveTokens(tokens, 'PASSWORD');
    renderPage();

    expect(await screen.findByRole('heading', { name: '비밀번호 변경' })).toBeInTheDocument();
  });

  it('hides it for an account that signed in with Google', async () => {
    saveTokens(tokens, 'GOOGLE');
    renderPage();

    await screen.findByText('a@a.com');
    expect(screen.queryByRole('heading', { name: '비밀번호 변경' })).not.toBeInTheDocument();
  });

  it('hides it when the server reports a social sign-up path', async () => {
    saveTokens(tokens, 'PASSWORD');
    vi.mocked(fetchMyProfile).mockResolvedValue({ ...profile, provider: 'GOOGLE' });
    renderPage();

    await screen.findByText('a@a.com');
    expect(screen.queryByRole('heading', { name: '비밀번호 변경' })).not.toBeInTheDocument();
  });
});

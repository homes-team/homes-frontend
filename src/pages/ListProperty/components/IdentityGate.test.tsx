import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { verifyIdentity } from '../../../api/auth/authApi';
import { fetchMyProfile } from '../../../api/user/userApi';
import { requestIdentityVerification } from '../../../utils/identityVerification';
import { UserProfile } from '../../../types/auth';
import IdentityGate from './IdentityGate';

vi.mock('../../../api/auth/authApi', () => ({ verifyIdentity: vi.fn() }));
vi.mock('../../../api/user/userApi', () => ({ fetchMyProfile: vi.fn() }));
vi.mock('../../../utils/identityVerification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../utils/identityVerification')>()),
  requestIdentityVerification: vi.fn(),
}));

const profile = (isIdentityVerified: boolean) => ({ isIdentityVerified }) as UserProfile;

const renderGate = (initialEntry = '/list-property/start') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <IdentityGate><p>매물 등록 위저드</p></IdentityGate>
    </MemoryRouter>,
  );

beforeEach(() => vi.resetAllMocks());

describe('IdentityGate', () => {
  it('lets a verified account straight into the wizard', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(profile(true));
    renderGate();

    expect(await screen.findByText('매물 등록 위저드')).toBeInTheDocument();
  });

  it('asks an unverified account to verify before listing', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(profile(false));
    renderGate();

    expect(await screen.findByText('매물을 등록하려면 본인인증이 필요해요')).toBeInTheDocument();
    expect(screen.queryByText('매물 등록 위저드')).not.toBeInTheDocument();
  });

  it('opens the wizard once the verification succeeds', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(profile(false));
    vi.mocked(requestIdentityVerification).mockResolvedValue('identity-verification-1');
    vi.mocked(verifyIdentity).mockResolvedValue({ userId: 1, isIdentityVerified: true, name: '홍길동' });
    renderGate();

    fireEvent.click(await screen.findByRole('button', { name: '본인인증 하기' }));

    expect(await screen.findByText('매물 등록 위저드')).toBeInTheDocument();
    expect(verifyIdentity).toHaveBeenCalledWith('identity-verification-1');
    expect(requestIdentityVerification).toHaveBeenCalledWith('/list-property/start');
  });

  it('keeps the gate and says why when the verification fails', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(profile(false));
    vi.mocked(requestIdentityVerification).mockRejectedValue(new Error('본인인증 설정이 아직 완료되지 않았어요.'));
    renderGate();

    fireEvent.click(await screen.findByRole('button', { name: '본인인증 하기' }));

    expect(await screen.findByText('본인인증 설정이 아직 완료되지 않았어요.')).toBeInTheDocument();
    expect(screen.queryByText('매물 등록 위저드')).not.toBeInTheDocument();
  });

  it('finishes a verification that redirected back with the result', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(profile(false));
    vi.mocked(verifyIdentity).mockResolvedValue({ userId: 1, isIdentityVerified: true, name: '홍길동' });
    renderGate('/list-property/start?identityVerificationId=abc');

    expect(await screen.findByText('매물 등록 위저드')).toBeInTheDocument();
    expect(verifyIdentity).toHaveBeenCalledWith('abc');
  });
});

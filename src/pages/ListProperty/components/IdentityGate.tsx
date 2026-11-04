import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { HelperText } from '../../../components/ui/Field';
import { verifyIdentity } from '../../../api/auth/authApi';
import { fetchMyProfile } from '../../../api/user/userApi';
import { parseIdentityRedirect, requestIdentityVerification } from '../../../utils/identityVerification';

type GateStatus = 'loading' | 'verified' | 'required' | 'error';

/**
 * 매물 등록 위저드 앞에서 실명 인증 여부를 확인한다.
 * 인증을 마치지 않은 계정에는 위저드 대신 "본인인증을 먼저 해주세요" 화면을 보여주고,
 * 이 화면에서 바로 인증한 뒤 등록을 이어갈 수 있게 한다.
 */
function IdentityGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<GateStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const complete = async (identityVerificationId: string) => {
    await verifyIdentity(identityVerificationId);
    setStatus('verified');
  };

  const run = async (start: () => Promise<string | null>) => {
    setBusy(true);
    setMessage(null);
    try {
      const identityVerificationId = await start();
      if (identityVerificationId) await complete(identityVerificationId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '본인인증에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchMyProfile()
      // 리다이렉트로 돌아와 이미 인증을 끝냈다면 늦게 도착한 조회 결과로 되돌리지 않는다
      .then((profile) => setStatus((prev) => (prev === 'verified' || profile.isIdentityVerified ? 'verified' : 'required')))
      .catch((err: Error) => {
        setMessage(err.message);
        setStatus('error');
      });
  }, []);

  // 팝업이 막히는 환경(모바일 등)에서는 인증 후 이 주소로 되돌아오므로 쿼리의 결과를 이어서 처리한다
  useEffect(() => {
    const redirected = parseIdentityRedirect(location.search);
    if (!redirected) return;
    navigate(location.pathname, { replace: true });
    void run(async () => {
      if (redirected.status === 'failure') throw new Error(redirected.message);
      return redirected.identityVerificationId;
    });
    // 최초 진입 시 한 번만 처리한다
  }, []);

  if (status === 'verified') return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-card bg-white px-6 py-10 text-center shadow-sm">
        {status === 'loading' && <p className="text-sm text-gray-500">확인하는 중...</p>}

        {status === 'error' && (
          <>
            <p className="text-sm font-medium text-danger">{message ?? '계정 정보를 불러오지 못했어요.'}</p>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </>
        )}

        {status === 'required' && (
          <>
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-50 text-3xl" aria-hidden="true">
              🪪
            </span>
            <h1 className="text-lg font-bold text-gray-900">매물을 등록하려면 본인인증이 필요해요</h1>
            <p className="text-sm text-gray-500">
              안전한 거래를 위해 실명 인증을 마친 분만 방을 내놓을 수 있어요. 휴대폰 인증은 1분이면 끝나요.
            </p>
            <div className="flex w-full flex-col gap-3">
              <Button fullWidth onClick={() => run(() => requestIdentityVerification(location.pathname))} disabled={busy}>
                {busy ? '인증 확인 중...' : '본인인증 하기'}
              </Button>
              <button type="button" className="text-[13px] text-gray-500 hover:text-primary" onClick={() => navigate('/')}>
                나중에 할게요
              </button>
            </div>
            {message && <HelperText>{message}</HelperText>}
          </>
        )}
      </div>
    </div>
  );
}

export default IdentityGate;

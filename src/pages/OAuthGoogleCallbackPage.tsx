import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithGoogle } from '../api/authApi';
import { ApiError } from '../api/client';
import { saveTokens } from '../utils/auth';

/**
 * 구글 OAuth 동의 후 돌아오는 콜백 페이지.
 * URL의 ?code=... 를 백엔드 POST /users/oauth/google로 넘겨 로그인/자동가입을 완료한다.
 */
function OAuthGoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    // React.StrictMode에서 effect가 두 번 실행돼도 authorization code를 두 번 쓰면
    // 구글이 두 번째 요청을 거부하므로, 같은 code로는 한 번만 호출되도록 막는다.
    if (requestedRef.current) return;
    requestedRef.current = true;

    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError('구글 로그인이 취소됐어요.');
      return;
    }
    if (!code) {
      setError('구글로부터 인증 코드를 받지 못했어요.');
      return;
    }

    loginWithGoogle({ authorizationCode: code })
      .then((tokenDto) => {
        saveTokens(tokenDto);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : '구글 로그인에 실패했어요.');
      });
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {error ? (
        <>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#dc2626' }}>{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'underline' }}
          >
            로그인 화면으로 돌아가기
          </button>
        </>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>구글 로그인 처리 중...</p>
      )}
    </div>
  );
}

export default OAuthGoogleCallbackPage;

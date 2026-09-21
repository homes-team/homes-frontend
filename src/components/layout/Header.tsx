import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_STATE_CHANGED_EVENT, isLoggedIn } from '../../api/client';
import { logout as logoutRequest } from '../../api/auth/authApi';
import { fetchNotifications, subscribeToNotifications } from '../../api/notification/notificationApi';
import { clearTokens, getCurrentUser } from '../../utils/auth';

const NAV_ITEMS = [
  { label: '원룸·투룸', to: '/search' },
  { label: '오피스텔', to: '/search?propertyType=OFFICETEL' },
  { label: '아파트', to: '/search?propertyType=APARTMENT' },
] as const;

function Header() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [unreadCount, setUnreadCount] = useState(0);
  const role = loggedIn ? getCurrentUser()?.role : null;
  const disconnectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const syncAuthenticationState = () => setLoggedIn(isLoggedIn());
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthenticationState);
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthenticationState);
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    fetchNotifications()
      .then((list) => {
        if (!cancelled) setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {
        /* 배지 카운트 실패는 조용히 무시 */
      });

    subscribeToNotifications(
      () => setUnreadCount((prev) => prev + 1),
      () => {
        /* SSE 연결 오류는 조용히 무시 — 배지가 즉시 갱신되지 않을 뿐, 알림 목록 페이지에서는 항상 최신을 불러온다 */
      },
    ).then((disconnect) => {
      if (cancelled) {
        disconnect();
        return;
      }
      disconnectRef.current = disconnect;
    });

    return () => {
      cancelled = true;
      disconnectRef.current?.();
      disconnectRef.current = null;
    };
  }, [loggedIn]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // 서버 로그아웃 실패해도 로컬 토큰은 지워서 로그인 화면으로 보낸다
    } finally {
      clearTokens();
      setLoggedIn(false);
      navigate('/');
    }
  };

  return (
    <header className="flex items-center justify-between px-10 py-3.5 bg-white">
      <div className="flex items-center gap-8">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="h-[30px] w-[30px] rounded-lg bg-primary" aria-hidden="true" />
          <span className="text-xl font-bold text-primary">홈즈</span>
        </button>
        <nav className="hidden items-center gap-8 md:flex" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.to)}
              className="text-[15px] font-medium text-gray-900 hover:text-primary"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="hidden w-[230px] rounded-pill bg-gray-100 px-4 py-[9px] text-left text-[13px] text-gray-500 md:block"
        >
          어떤 동네, 어떤 방을 찾으세요?
        </button>
        {loggedIn && (
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            aria-label="알림"
            className="relative text-lg leading-none"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-pill bg-danger px-1 text-center text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
        {loggedIn && (
          <button type="button" onClick={() => navigate('/chats')} aria-label="채팅" className="text-lg leading-none">
            💬
          </button>
        )}
        {loggedIn && (
          <button
            type="button"
            onClick={() => navigate(role === 'AGENT' ? '/realtor/mypage' : '/mypage')}
            className="text-sm font-medium text-gray-500"
          >
            마이페이지
          </button>
        )}
        {loggedIn ? (
          <button type="button" className="text-sm font-medium text-gray-500" onClick={handleLogout}>
            로그아웃
          </button>
        ) : (
          <button type="button" onClick={() => navigate('/login')} className="text-sm font-medium text-gray-500">
            로그인
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(loggedIn ? '/list-property/start' : '/login')}
          className="rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          방 내놓기
        </button>
      </div>
    </header>
  );
}

export default Header;
